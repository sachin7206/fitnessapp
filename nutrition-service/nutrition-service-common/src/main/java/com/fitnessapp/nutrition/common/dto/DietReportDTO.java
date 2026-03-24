package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DietReportDTO {
    private String startDate;
    private String endDate;
    private int totalTrackedDays;
    private MacroTargets targets;
    private List<DailyEntry> dailyBreakdown;
    private MacroTotals averages;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MacroTargets {
        private int targetCalories;
        private double targetProtein;
        private double targetCarbs;
        private double targetFat;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyEntry {
        private String date;
        private int calories;
        private double protein;
        private double carbs;
        private double fat;
        private int completedMeals;
        private int totalMeals;
        // Variance vs target
        private int calorieVariance;   // positive = over target
        private double proteinVariance;
        private double carbsVariance;
        private double fatVariance;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MacroTotals {
        private int avgCalories;
        private double avgProtein;
        private double avgCarbs;
        private double avgFat;
    }
}

