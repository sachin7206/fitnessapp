package com.fitnessapp.payment.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private PaymentDTO payment;
    private String qrCodeBase64;
    private String upiDeepLink;
    private String merchantUpiId;
    private String merchantName;
    private String razorpayOrderId;  // Razorpay order ID for checkout
    private String razorpayKeyId;    // Razorpay key_id for frontend
}
