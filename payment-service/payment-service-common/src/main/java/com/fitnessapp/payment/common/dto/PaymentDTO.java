package com.fitnessapp.payment.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private Long subscriptionId;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod; // UPI, QR_CODE
    private String status; // PENDING, SUCCESS, FAILED, REFUNDED
    private String transactionRef;
    private String upiId;
    private String merchantName;
    private String description;
    private String paymentGateway;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
