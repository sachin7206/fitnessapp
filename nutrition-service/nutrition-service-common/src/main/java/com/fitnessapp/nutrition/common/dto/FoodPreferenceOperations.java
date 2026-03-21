package com.fitnessapp.nutrition.common.dto;

public interface FoodPreferenceOperations {
    UserFoodPreferenceDTO getFoodPreferences(Long userId);
    UserFoodPreferenceDTO saveFoodPreferences(Long userId, UserFoodPreferenceDTO dto);
}
