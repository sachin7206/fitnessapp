package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreePlanRequestDTO {
    @Size(max = 100, message = "Plan name must be ≤ 100 characters")
    private String planName;

    @Min(value = 0, message = "Total calories must be ≥ 0")
    @Max(value = 50000, message = "Total calories must be ≤ 50000")
    private Integer totalCalories;

    @DecimalMin(value = "0.0", message = "Protein must be ≥ 0")
    @DecimalMax(value = "2000.0", message = "Protein must be ≤ 2000g")
    private Double proteinGrams;

    @DecimalMin(value = "0.0", message = "Carbs must be ≥ 0")
    @DecimalMax(value = "3000.0", message = "Carbs must be ≤ 3000g")
    private Double carbsGrams;

    @DecimalMin(value = "0.0", message = "Fat must be ≥ 0")
    @DecimalMax(value = "2000.0", message = "Fat must be ≤ 2000g")
    private Double fatGrams;

    @NotNull(message = "Meals list is required")
    @Size(min = 1, max = 20, message = "Must have between 1 and 20 meals")
    private List<Map<String, Object>> meals;
}


