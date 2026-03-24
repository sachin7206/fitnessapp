package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealCompletionRequest {
    @NotNull(message = "Meal ID is required")
    private Long mealId;

    @Size(max = 200, message = "Meal name must be ≤ 200 characters")
    private String mealName;

    @Size(max = 30, message = "Meal type must be ≤ 30 characters")
    private String mealType;

    @Size(max = 20, message = "Time of day must be ≤ 20 characters")
    private String timeOfDay;
    private Boolean completed;

    @Size(max = 30, message = "Completed at must be ≤ 30 characters")
    private String completedAt;
    private Boolean replaced;

    @Size(max = 200, message = "Replaced with must be ≤ 200 characters")
    private String replacedWith;

    @Size(max = 200, message = "Original name must be ≤ 200 characters")
    private String originalName;

    @Min(value = 0, message = "Calories must be ≥ 0")
    @Max(value = 10000, message = "Calories must be ≤ 10000")
    private Integer calories;

    @DecimalMin(value = "0.0", message = "Protein must be ≥ 0")
    @DecimalMax(value = "500.0", message = "Protein must be ≤ 500g")
    private Double proteinGrams;

    @DecimalMin(value = "0.0", message = "Carbs must be ≥ 0")
    @DecimalMax(value = "1000.0", message = "Carbs must be ≤ 1000g")
    private Double carbsGrams;

    @DecimalMin(value = "0.0", message = "Fat must be ≥ 0")
    @DecimalMax(value = "500.0", message = "Fat must be ≤ 500g")
    private Double fatGrams;

    // Original macros — saved when meal is replaced, used to restore on undo
    private Integer originalCalories;
    private Double originalProteinGrams;
    private Double originalCarbsGrams;
    private Double originalFatGrams;
}

