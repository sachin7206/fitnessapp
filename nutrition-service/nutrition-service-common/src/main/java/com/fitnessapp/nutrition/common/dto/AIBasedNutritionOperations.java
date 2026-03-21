package com.fitnessapp.nutrition.common.dto;

import java.util.Map;

public interface AIBasedNutritionOperations {
    NutritionPlanDTO generatePersonalizedPlan(Long userId, GenerateNutritionPlanRequest request);
    Map<String, Object> estimateFoodMacros(String foodDescription);
}
