package com.fitnessapp.nutrition.common.dto;

public interface GroceryListOperations {
    GroceryListResponseDTO getGroceryList(Long userId, int weekNumber);
}
