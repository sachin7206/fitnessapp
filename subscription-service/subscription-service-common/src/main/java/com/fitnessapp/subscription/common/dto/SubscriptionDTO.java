package com.fitnessapp.subscription.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private Long planId;
    private String planName;
    private BigDecimal planPrice;
    private Integer durationMonths;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT
    private String transactionRef;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


