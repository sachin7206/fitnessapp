package com.fitnessapp.nutrition.common.dto;

public interface MealSwapOperations {
    MealSwapResponseDTO suggestMealSwap(String email, MealSwapRequestDTO request);
}

