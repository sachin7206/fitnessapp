package com.fitnessapp.nutrition.common.dto;

public interface MealTrackingOperations {
    DailyNutritionSummaryDTO syncDailyTracking(String email, DailyTrackingSyncRequest request);
    DailyNutritionSummaryDTO getTodayTracking(String email);
}

