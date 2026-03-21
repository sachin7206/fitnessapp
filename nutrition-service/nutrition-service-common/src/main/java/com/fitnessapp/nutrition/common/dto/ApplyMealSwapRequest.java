package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class ApplyMealSwapRequest {
    @NotNull(message = "Original meal ID is required")
    private Long originalMealId;

    @NotBlank(message = "New meal name is required")
    @Size(max = 200, message = "New meal name must be ≤ 200 characters")
    private String newMealName;

    @Min(value = 0, message = "Calories must be ≥ 0")
    @Max(value = 10000, message = "Calories must be ≤ 10000")
    private int newCalories;

    @DecimalMin(value = "0.0", message = "Protein must be ≥ 0")
    @DecimalMax(value = "500.0", message = "Protein must be ≤ 500g")
    private double newProteinGrams;

    @DecimalMin(value = "0.0", message = "Carbs must be ≥ 0")
    @DecimalMax(value = "1000.0", message = "Carbs must be ≤ 1000g")
    private double newCarbsGrams;

    @DecimalMin(value = "0.0", message = "Fat must be ≥ 0")
    @DecimalMax(value = "500.0", message = "Fat must be ≤ 500g")
    private double newFatGrams;
}

