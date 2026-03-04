package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class MealSwapRequestDTO {
    private Long mealId;
    private String mealName;
    private String mealType;
    private int calories;
    private double proteinGrams;
    private double carbsGrams;
    private double fatGrams;
}

