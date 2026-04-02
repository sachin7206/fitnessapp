package com.fitnessapp.nutrition.common.dto;

import java.time.LocalDateTime;
import java.util.Map;

public interface AIBasedNutritionOperations {
    NutritionPlanDTO generatePersonalizedPlan(Long userId, GenerateNutritionPlanRequest request);
    Map<String, Object> estimateFoodMacros(String foodDescription);
    long getAiPlanCount(Long userId, LocalDateTime since);
}
