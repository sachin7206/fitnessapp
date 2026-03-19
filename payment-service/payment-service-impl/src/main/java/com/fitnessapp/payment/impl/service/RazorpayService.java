package com.fitnessapp.payment.impl.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@Slf4j
public class RazorpayService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    private static final String RAZORPAY_API = "https://api.razorpay.com/v1";

    public RazorpayService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public String getKeyId() {
        return keyId;
    }

    /**
     * Create a Razorpay Order. Returns the order_id needed for frontend checkout.
     */
    public RazorpayOrderResponse createOrder(BigDecimal amount, String currency, String receipt, Long subscriptionId) {
        try {
            long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

            String basicAuth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

            Map<String, Object> body = Map.of(
                    "amount", amountInPaise,
                    "currency", currency != null ? currency : "INR",
                    "receipt", receipt,
                    "notes", Map.of("subscriptionId", subscriptionId != null ? subscriptionId.toString() : "")
            );

            String responseBody = webClient.post()
                    .uri(RAZORPAY_API + "/orders")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode json = objectMapper.readTree(responseBody);
            String orderId = json.path("id").asText();
            String status = json.path("status").asText();

            log.info("Razorpay order created: orderId={}, status={}, amount={} paise", orderId, status, amountInPaise);
            return new RazorpayOrderResponse(true, orderId, amountInPaise, null);
        } catch (Exception e) {
            log.error("Razorpay create order failed: {}", e.getMessage(), e);
            return new RazorpayOrderResponse(false, null, 0, e.getMessage());
        }
    }

    /**
     * Verify payment signature: HMAC-SHA256(orderId + "|" + paymentId, keySecret) == signature
     */
    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String data = razorpayOrderId + "|" + razorpayPaymentId;
            String expectedSignature = hmacSha256(data, keySecret);
            boolean valid = expectedSignature.equals(razorpaySignature);
            log.info("Razorpay signature verification: valid={}, orderId={}, paymentId={}", valid, razorpayOrderId, razorpayPaymentId);
            return valid;
        } catch (Exception e) {
            log.error("Razorpay signature verification error: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Verify webhook signature: HMAC-SHA256(rawBody, webhookSecret) == X-Razorpay-Signature header
     */
    public boolean verifyWebhookSignature(String rawBody, String xRazorpaySignature) {
        try {
            if (webhookSecret == null || webhookSecret.isBlank()) {
                log.warn("Razorpay webhook secret not configured, skipping verification");
                return true;
            }
            String expectedSignature = hmacSha256(rawBody, webhookSecret);
            return expectedSignature.equals(xRazorpaySignature);
        } catch (Exception e) {
            log.error("Razorpay webhook signature verification error: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Fetch payment details from Razorpay API.
     */
    public JsonNode fetchPayment(String paymentId) {
        try {
            String basicAuth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

            String responseBody = webClient.get()
                    .uri(RAZORPAY_API + "/payments/" + paymentId)
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readTree(responseBody);
        } catch (Exception e) {
            log.error("Razorpay fetch payment error: {}", e.getMessage(), e);
            return null;
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    // DTOs
    public record RazorpayOrderResponse(boolean success, String orderId, long amountInPaise, String errorMessage) {}
}

