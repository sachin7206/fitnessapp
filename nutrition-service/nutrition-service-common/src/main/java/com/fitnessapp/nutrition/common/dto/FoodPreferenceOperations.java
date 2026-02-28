package com.fitnessapp.nutrition.common.dto;

public interface FoodPreferenceOperations {
    UserFoodPreferenceDTO getFoodPreferences(String email);
    UserFoodPreferenceDTO saveFoodPreferences(String email, UserFoodPreferenceDTO dto);
}

