package com.fitnessapp.nutrition.common.dto;

import java.util.List;

public interface FoodLoggingOperations {
    FoodLogDTO logFoodPhoto(Long userId, FoodPhotoLogRequest request);
    List<FoodLogDTO> getTodayFoodLogs(Long userId);
    List<FoodLogDTO> getFoodLogHistory(Long userId, int days);
}
