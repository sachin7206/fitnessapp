package com.fitnessapp.payment.impl.service;

import com.fitnessapp.payment.common.dto.*;
import com.fitnessapp.payment.impl.model.Payment;
import com.fitnessapp.payment.impl.repository.PaymentRepository;
import com.fitnessapp.payment.impl.util.UpiQrCodeGenerator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService implements PaymentOperations {

    private final PaymentRepository paymentRepo;
    private final WebClient.Builder webClientBuilder;
    private final RazorpayService razorpayService;
    private final ObjectMapper objectMapper;

    @Value("${merchant.upi.id:fitnessapp@upi}")
    private String merchantUpiId;

    @Value("${merchant.name:FitnessApp}")
    private String merchantName;

    @Value("${subscription.service.url:http://localhost:8087}")
    private String subscriptionServiceUrl;

    @Override
    @Transactional
    public PaymentResponse initiatePayment(String email, Long userId, InitiatePaymentRequest request) {
        String transactionRef = "FA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = new Payment();
        payment.setUserEmail(email);
        payment.setUserId(userId);
        payment.setSubscriptionId(request.getSubscriptionId());
        payment.setAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO);
        payment.setCurrency(request.getCurrency() != null ? request.getCurrency() : "INR");
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "RAZORPAY");
        payment.setStatus("PENDING");
        payment.setTransactionRef(transactionRef);
        payment.setUpiId(request.getUpiId());
        payment.setMerchantUpiId(merchantUpiId);
        payment.setMerchantName(merchantName);
        payment.setDescription("FitnessApp Subscription Payment");

        String method = request.getPaymentMethod() != null ? request.getPaymentMethod() : "RAZORPAY";

        // Razorpay PG flow
        if ("RAZORPAY".equalsIgnoreCase(method)) {
            payment.setPaymentGateway("RAZORPAY");

            RazorpayService.RazorpayOrderResponse orderResp = razorpayService.createOrder(
                    payment.getAmount(), payment.getCurrency(), transactionRef, request.getSubscriptionId());

            if (orderResp.success()) {
                payment.setRazorpayOrderId(orderResp.orderId());
            } else {
                log.error("Razorpay order creation failed: {}", orderResp.errorMessage());
            }

            payment = paymentRepo.save(payment);
            log.info("Payment {} initiated (Razorpay) for user {}, orderId={}", payment.getId(), email, payment.getRazorpayOrderId());

            PaymentResponse response = new PaymentResponse();
            response.setPayment(toDTO(payment));
            response.setRazorpayOrderId(payment.getRazorpayOrderId());
            response.setRazorpayKeyId(razorpayService.getKeyId());
            return response;
        }

        // Manual UPI / QR Code flow (existing)
        payment.setPaymentGateway("MANUAL_UPI");
        payment = paymentRepo.save(payment);
        log.info("Payment {} initiated (Manual UPI) for user {}", payment.getId(), email);

        String upiDeepLink = UpiQrCodeGenerator.generateUpiDeepLink(
                merchantUpiId, merchantName, payment.getAmount(),
                "FitnessApp Subscription", transactionRef);
        String qrCodeBase64 = UpiQrCodeGenerator.generateQrCodeBase64(upiDeepLink);

        PaymentResponse response = new PaymentResponse();
        response.setPayment(toDTO(payment));
        response.setQrCodeBase64(qrCodeBase64);
        response.setUpiDeepLink(upiDeepLink);
        response.setMerchantUpiId(merchantUpiId);
        response.setMerchantName(merchantName);
        return response;
    }

    @Override
    @Transactional
    public PaymentDTO confirmPayment(Long paymentId, String transactionRef) {
        Payment payment = paymentRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if ("SUCCESS".equals(payment.getStatus())) {
            return toDTO(payment);
        }

        // Manual confirmation (for Manual UPI with UTR)
        payment.setStatus("SUCCESS");
        if (transactionRef != null && !transactionRef.isBlank()) {
            payment.setTransactionRef(transactionRef);
        }
        payment = paymentRepo.save(payment);
        log.info("Payment {} manually confirmed", paymentId);
        activateSubscriptionSafe(payment);
        return toDTO(payment);
    }

    @Override
    @Transactional
    public PaymentDTO verifyRazorpayPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        // Find payment by Razorpay order ID
        Payment payment = paymentRepo.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for Razorpay orderId: " + razorpayOrderId));

        if ("SUCCESS".equals(payment.getStatus())) {
            return toDTO(payment); // Already verified
        }

        // Verify signature
        boolean valid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!valid) {
            payment.setStatus("FAILED");
            payment.setGatewayResponse("Signature verification failed");
            paymentRepo.save(payment);
            throw new RuntimeException("Razorpay payment signature verification failed");
        }

        payment.setStatus("SUCCESS");
        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setGatewayResponse("Signature verified: " + razorpaySignature);
        payment = paymentRepo.save(payment);

        log.info("Razorpay payment verified: paymentId={}, rpOrderId={}, rpPaymentId={}", payment.getId(), razorpayOrderId, razorpayPaymentId);
        activateSubscriptionSafe(payment);
        return toDTO(payment);
    }

    @Override
    @Transactional
    public PaymentDTO handleRazorpayWebhook(String rawBody, String xRazorpaySignature) {
        boolean valid = razorpayService.verifyWebhookSignature(rawBody, xRazorpaySignature);
        if (!valid) {
            throw new RuntimeException("Razorpay webhook signature verification failed");
        }

        try {
            JsonNode json = objectMapper.readTree(rawBody);
            String event = json.path("event").asText();
            JsonNode paymentEntity = json.path("payload").path("payment").path("entity");
            String razorpayOrderId = paymentEntity.path("order_id").asText();
            String razorpayPaymentId = paymentEntity.path("id").asText();
            String status = paymentEntity.path("status").asText();

            Payment payment = paymentRepo.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            if (payment == null) {
                log.warn("Razorpay webhook: payment not found for orderId={}", razorpayOrderId);
                return null;
            }

            if ("SUCCESS".equals(payment.getStatus())) {
                return toDTO(payment); // Already processed
            }

            if ("payment.captured".equals(event) || "captured".equals(status)) {
                payment.setStatus("SUCCESS");
                payment.setRazorpayPaymentId(razorpayPaymentId);
            } else if ("payment.failed".equals(event) || "failed".equals(status)) {
                payment.setStatus("FAILED");
            }
            payment.setGatewayResponse(rawBody);
            payment = paymentRepo.save(payment);

            log.info("Razorpay webhook processed: event={}, paymentId={}, status={}", event, payment.getId(), payment.getStatus());

            if ("SUCCESS".equals(payment.getStatus())) {
                activateSubscriptionSafe(payment);
            }
            return toDTO(payment);
        } catch (Exception e) {
            log.error("Razorpay webhook processing error: {}", e.getMessage(), e);
            throw new RuntimeException("Webhook processing failed: " + e.getMessage());
        }
    }

    @Override
    public PaymentDTO getPaymentStatus(Long paymentId) {
        return paymentRepo.findById(paymentId)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
    }

    @Override
    public List<PaymentDTO> getPaymentHistory(String email) {
        return paymentRepo.findByUserEmailOrderByCreatedAtDesc(email).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private void activateSubscriptionSafe(Payment payment) {
        if (payment.getSubscriptionId() != null) {
            try {
                activateSubscription(payment.getSubscriptionId(), payment.getTransactionRef());
                log.info("Subscription {} activated via payment {}", payment.getSubscriptionId(), payment.getId());
            } catch (Exception e) {
                log.error("Failed to activate subscription {} after payment {}: {}",
                        payment.getSubscriptionId(), payment.getId(), e.getMessage());
            }
        }
    }

    private void activateSubscription(Long subscriptionId, String transactionRef) {
        webClientBuilder.build()
                .post()
                .uri(subscriptionServiceUrl + "/subscriptions/{id}/activate?transactionRef={ref}",
                        subscriptionId, transactionRef)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private PaymentDTO toDTO(Payment p) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setUserEmail(p.getUserEmail());
        dto.setSubscriptionId(p.getSubscriptionId());
        dto.setAmount(p.getAmount());
        dto.setCurrency(p.getCurrency());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setStatus(p.getStatus());
        dto.setTransactionRef(p.getTransactionRef());
        dto.setUpiId(p.getUpiId());
        dto.setMerchantName(p.getMerchantName());
        dto.setDescription(p.getDescription());
        dto.setPaymentGateway(p.getPaymentGateway());
        dto.setRazorpayOrderId(p.getRazorpayOrderId());
        dto.setRazorpayPaymentId(p.getRazorpayPaymentId());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
