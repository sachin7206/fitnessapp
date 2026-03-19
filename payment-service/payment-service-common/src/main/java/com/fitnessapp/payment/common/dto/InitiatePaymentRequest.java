package com.fitnessapp.payment.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentRequest {
    private Long subscriptionId;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod; // UPI or QR_CODE
    private String upiId; // optional, for UPI direct pay
}

