package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyMealTrackingDTO {
    private Long mealId;
    private String mealName;
    private String mealType;
    private String timeOfDay;
    private Boolean completed;
    private String completedAt;
    private Boolean replaced;
    private String replacedWith;
    private String originalName;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
}

