package com.fitnessapp.subscription.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanDTO {
    private Long id;
    private String name;
    private String description;
    private Integer durationMonths;
    private BigDecimal price;
    private String currency;
    private Boolean isActive;
    private String features; // JSON string of features list
}

