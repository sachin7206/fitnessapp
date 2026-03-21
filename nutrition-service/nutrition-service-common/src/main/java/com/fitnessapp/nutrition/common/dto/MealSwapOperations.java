package com.fitnessapp.nutrition.common.dto;

public interface MealSwapOperations {
    MealSwapResponseDTO suggestMealSwap(Long userId, MealSwapRequestDTO request);
}
