package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyTrackingSyncRequest {
    @NotNull(message = "Meals list is required")
    @Size(max = 50, message = "Cannot sync more than 50 meals at once")
    private List<@Valid MealCompletionRequest> meals;

    @Min(value = 0, message = "Consumed calories must be ≥ 0")
    @Max(value = 50000, message = "Consumed calories must be ≤ 50000")
    private Integer consumedCalories;

    @DecimalMin(value = "0.0", message = "Consumed protein must be ≥ 0")
    @DecimalMax(value = "2000.0", message = "Consumed protein must be ≤ 2000g")
    private Double consumedProtein;

    @DecimalMin(value = "0.0", message = "Consumed carbs must be ≥ 0")
    @DecimalMax(value = "3000.0", message = "Consumed carbs must be ≤ 3000g")
    private Double consumedCarbs;

    @DecimalMin(value = "0.0", message = "Consumed fat must be ≥ 0")
    @DecimalMax(value = "2000.0", message = "Consumed fat must be ≤ 2000g")
    private Double consumedFat;
}

