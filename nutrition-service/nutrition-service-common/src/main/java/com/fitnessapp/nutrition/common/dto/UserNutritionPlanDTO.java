package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class UserNutritionPlanDTO {
    private Long id;
    private Long userId;
    private NutritionPlanDTO nutritionPlan;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer currentDay;
    private String status;
    private Integer completedMeals;
    private Integer totalMeals;
    private Double adherencePercentage;
    private String notes;
    private LocalDateTime enrolledAt;
}

