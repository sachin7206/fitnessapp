package com.fitnessapp.nutrition.common.dto;

public interface GroceryListOperations {
    GroceryListResponseDTO getGroceryList(String email, int weekNumber);
}

