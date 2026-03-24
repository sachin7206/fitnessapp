package com.fitnessapp.nutrition.common.dto;

import java.time.LocalDate;

public interface MealTrackingOperations {
    DailyNutritionSummaryDTO syncDailyTracking(Long userId, DailyTrackingSyncRequest request);
    DailyNutritionSummaryDTO getTodayTracking(Long userId);
    DietReportDTO getDietReport(Long userId, LocalDate startDate, LocalDate endDate);
}
