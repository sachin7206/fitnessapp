package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyNutritionSummaryDTO {
    private LocalDate trackingDate;
    private Integer consumedCalories;
    private Double consumedProtein;
    private Double consumedCarbs;
    private Double consumedFat;
    private Integer totalMeals;
    private Integer completedMeals;
    private List<DailyMealTrackingDTO> meals;
}

