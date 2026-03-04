package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiMealSwapRequest {
    private String originalMealName;
    private int originalCalories;
    private double originalProtein;
    private double originalCarbs;
    private double originalFat;
    private String mealType;
    private String dietType;
    private String region;
    private int tolerancePercent = 5;
}

