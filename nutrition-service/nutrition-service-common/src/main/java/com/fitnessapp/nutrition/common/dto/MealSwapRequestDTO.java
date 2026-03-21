package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class MealSwapRequestDTO {
    @NotNull(message = "Meal ID is required")
    private Long mealId;

    @NotBlank(message = "Meal name is required")
    @Size(max = 200, message = "Meal name must be ≤ 200 characters")
    private String mealName;

    @Size(max = 30, message = "Meal type must be ≤ 30 characters")
    private String mealType;

    @Min(value = 0, message = "Calories must be ≥ 0")
    @Max(value = 10000, message = "Calories must be ≤ 10000")
    private int calories;

    @DecimalMin(value = "0.0", message = "Protein must be ≥ 0")
    @DecimalMax(value = "500.0", message = "Protein must be ≤ 500g")
    private double proteinGrams;

    @DecimalMin(value = "0.0", message = "Carbs must be ≥ 0")
    @DecimalMax(value = "1000.0", message = "Carbs must be ≤ 1000g")
    private double carbsGrams;

    @DecimalMin(value = "0.0", message = "Fat must be ≥ 0")
    @DecimalMax(value = "500.0", message = "Fat must be ≤ 500g")
    private double fatGrams;
}

