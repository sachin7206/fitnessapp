package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class GenerateNutritionPlanRequest {
    private String region;
    private String primaryGoal;
    private Integer targetCalories;
    private List<String> excludeIngredients;

    // Custom meals from UI
    private List<CustomMeal> customMeals;

    // Workout meal preferences
    private Boolean includePreWorkoutMeal;
    private String preWorkoutTime;
    private Boolean includePostWorkoutMeal;
    private String postWorkoutTime;

    // Supplements
    private Boolean canTakeWheyProtein;
    private List<String> supplements;

    // Detailed food preferences from UI
    private FoodPreferences foodPreferences;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CustomMeal {
        private Integer id;
        private String name;
        private String type; // BREAKFAST, LUNCH, DINNER, SNACK, etc.
        private String time;
        private Boolean enabled;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FoodPreferences {
        private Boolean includeChicken;
        private Boolean includeFish;
        private Boolean includeRedMeat;
        private Integer eggsPerDay;
        private Boolean includeRice;
        private Boolean includeRoti;
        private Boolean includeDal;
        private Boolean includeMilk;
        private Boolean includePaneer;
        private Boolean includeCurd;
        private List<String> allergies;
        private List<String> dislikedFoods;
        private String cookingOilPreference;
        private Boolean preferHomemade;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DietaryRestriction {
        private String name;
        private String severity;
    }
}

