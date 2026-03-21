package com.fitnessapp.nutrition.common.dto;

public interface MealTrackingOperations {
    DailyNutritionSummaryDTO syncDailyTracking(Long userId, DailyTrackingSyncRequest request);
    DailyNutritionSummaryDTO getTodayTracking(Long userId);
}
