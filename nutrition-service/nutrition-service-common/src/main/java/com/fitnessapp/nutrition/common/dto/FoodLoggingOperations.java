package com.fitnessapp.nutrition.common.dto;

import java.util.List;

public interface FoodLoggingOperations {
    FoodLogDTO logFoodPhoto(String email, FoodPhotoLogRequest request);
    List<FoodLogDTO> getTodayFoodLogs(String email);
    List<FoodLogDTO> getFoodLogHistory(String email, int days);
}

