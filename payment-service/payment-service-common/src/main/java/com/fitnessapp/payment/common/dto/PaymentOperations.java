package com.fitnessapp.payment.common.dto;

import java.util.List;

public interface PaymentOperations {
    PaymentResponse initiatePayment(String email, Long userId, InitiatePaymentRequest request);
    PaymentDTO confirmPayment(Long paymentId, String transactionRef);
    PaymentDTO getPaymentStatus(Long paymentId);
    List<PaymentDTO> getPaymentHistory(String email);
    PaymentDTO verifyRazorpayPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature);
    PaymentDTO handleRazorpayWebhook(String rawBody, String xRazorpaySignature);
}
