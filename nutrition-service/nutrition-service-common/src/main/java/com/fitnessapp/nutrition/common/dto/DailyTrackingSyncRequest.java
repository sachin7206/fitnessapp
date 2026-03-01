package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyTrackingSyncRequest {
    private List<MealCompletionRequest> meals;
    private Integer consumedCalories;
    private Double consumedProtein;
    private Double consumedCarbs;
    private Double consumedFat;
}

