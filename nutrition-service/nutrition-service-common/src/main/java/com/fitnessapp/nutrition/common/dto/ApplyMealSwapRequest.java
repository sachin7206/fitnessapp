package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class ApplyMealSwapRequest {
    private Long originalMealId;
    private String newMealName;
    private int newCalories;
    private double newProteinGrams;
    private double newCarbsGrams;
    private double newFatGrams;
}

