package com.fitnessapp.payment.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import com.fitnessapp.payment.common.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentOperations paymentOperations;
    private final HttpServletRequest httpServletRequest;


    private Long getCurrentUserId() {
        Object userId = httpServletRequest.getAttribute("userId");
        return userId instanceof Long ? (Long) userId : null;
    }

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(@RequestBody InitiatePaymentRequest request) {
        PaymentResponse response = paymentOperations.initiatePayment(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment initiated", response));
    }

    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<ApiResponse<PaymentDTO>> confirmPayment(
            @PathVariable Long paymentId,
            @RequestParam(required = false) String transactionRef) {
        PaymentDTO payment = paymentOperations.confirmPayment(paymentId, transactionRef);
        return ResponseEntity.ok(ApiResponse.success("Payment confirmed", payment));
    }

    @GetMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentStatus(@PathVariable Long paymentId) {
        PaymentDTO payment = paymentOperations.getPaymentStatus(paymentId);
        return ResponseEntity.ok(ApiResponse.success("Payment status retrieved", payment));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getPaymentHistory() {
        List<PaymentDTO> history = paymentOperations.getPaymentHistory(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Payment history retrieved", history));
    }

    /**
     * Razorpay payment verification — called by frontend after checkout success.
     * Receives razorpay_order_id, razorpay_payment_id, razorpay_signature.
     */
    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<PaymentDTO>> verifyRazorpayPayment(@RequestBody Map<String, String> body) {
        String orderId = body.get("razorpay_order_id");
        String paymentId = body.get("razorpay_payment_id");
        String signature = body.get("razorpay_signature");

        if (orderId == null || paymentId == null || signature == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature"));
        }

        PaymentDTO result = paymentOperations.verifyRazorpayPayment(orderId, paymentId, signature);
        return ResponseEntity.ok(ApiResponse.success("Payment verified", result));
    }

    /**
     * Razorpay webhook — unauthenticated endpoint.
     * Razorpay POSTs raw JSON with X-Razorpay-Signature header.
     */
    @PostMapping("/razorpay/webhook")
    public ResponseEntity<String> razorpayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String xRazorpaySignature) {
        try {
            paymentOperations.handleRazorpayWebhook(rawBody, xRazorpaySignature);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Razorpay webhook error: {}", e.getMessage(), e);
            return ResponseEntity.ok("FAILED");
        }
    }
}
