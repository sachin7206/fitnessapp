package com.fitnessapp.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHealthMetricsRequest {
    private Double height;
    private Double currentWeight;
    private Double targetWeight;
    private String activityLevel;
    private List<String> healthConditions;
    private List<String> dietaryPreferences;
}

