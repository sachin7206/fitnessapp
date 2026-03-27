package com.fitnessapp.payment.impl.validation;

import com.fitnessapp.payment.impl.model.Payment;
import com.fitnessapp.payment.impl.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for payment operations.
 */
@Component
@RequiredArgsConstructor
public class PaymentValidator {

    private final PaymentRepository paymentRepository;

    /**
     * Validate and retrieve a payment by ID.
     */
    public Payment validatePaymentExists(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
    }

    /**
     * Validate and retrieve a payment by Razorpay order ID.
     */
    public Payment validatePaymentExistsByRazorpayOrderId(String razorpayOrderId) {
        return paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for Razorpay orderId: " + razorpayOrderId));
    }

    /**
     * Validate Razorpay payment signature.
     */
    public void validateRazorpaySignature(boolean isValid, Payment payment) {
        if (!isValid) {
            payment.setStatus("FAILED");
            payment.setGatewayResponse("Signature verification failed");
            paymentRepository.save(payment);
            throw new RuntimeException("Razorpay payment signature verification failed");
        }
    }

    /**
     * Validate webhook signature.
     */
    public void validateWebhookSignature(boolean isValid) {
        if (!isValid) {
            throw new RuntimeException("Razorpay webhook signature verification failed");
        }
    }
}

