package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class GenerateNutritionPlanRequest {
    @Size(max = 50, message = "Region must be ≤ 50 characters")
    private String region;

    @Size(max = 50, message = "Primary goal must be ≤ 50 characters")
    private String primaryGoal;

    @Min(value = 500, message = "Target calories must be ≥ 500")
    @Max(value = 10000, message = "Target calories must be ≤ 10000")
    private Integer targetCalories;

    @Size(max = 50, message = "Cannot exclude more than 50 ingredients")
    private List<@Size(max = 100, message = "Each excluded ingredient must be ≤ 100 characters") String> excludeIngredients;

    // Custom meals from UI
    @Size(max = 20, message = "Cannot have more than 20 custom meals")
    private List<@Valid CustomMeal> customMeals;

    // Workout meal preferences
    private Boolean includePreWorkoutMeal;
    @Size(max = 20, message = "Pre-workout time must be ≤ 20 characters")
    private String preWorkoutTime;
    private Boolean includePostWorkoutMeal;
    @Size(max = 20, message = "Post-workout time must be ≤ 20 characters")
    private String postWorkoutTime;

    // Supplements
    private Boolean canTakeWheyProtein;
    @Size(max = 20, message = "Cannot have more than 20 supplements")
    private List<@Size(max = 100, message = "Each supplement must be ≤ 100 characters") String> supplements;

    // Detailed food preferences from UI
    @Valid
    private FoodPreferences foodPreferences;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CustomMeal {
        private Long id;
        @Size(max = 100, message = "Meal name must be ≤ 100 characters")
        private String name;
        @Size(max = 30, message = "Meal type must be ≤ 30 characters")
        private String type; // BREAKFAST, LUNCH, DINNER, SNACK, etc.
        @Size(max = 20, message = "Meal time must be ≤ 20 characters")
        private String time;
        private Boolean enabled;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FoodPreferences {
        private Boolean includeChicken;
        private Boolean includeFish;
        private Boolean includeRedMeat;
        @Min(value = 0, message = "Eggs per day must be ≥ 0")
        @Max(value = 12, message = "Eggs per day must be ≤ 12")
        private Integer eggsPerDay;
        private Boolean includeRice;
        private Boolean includeRoti;
        private Boolean includeDal;
        private Boolean includeMilk;
        private Boolean includePaneer;
        private Boolean includeCurd;
        @Size(max = 20, message = "Cannot have more than 20 allergies")
        private List<@Size(max = 100, message = "Each allergy must be ≤ 100 characters") String> allergies;
        @Size(max = 50, message = "Cannot have more than 50 disliked foods")
        private List<@Size(max = 100, message = "Each disliked food must be ≤ 100 characters") String> dislikedFoods;
        @Size(max = 50, message = "Cooking oil preference must be ≤ 50 characters")
        private String cookingOilPreference;
        private Boolean preferHomemade;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DietaryRestriction {
        @Size(max = 100, message = "Restriction name must be ≤ 100 characters")
        private String name;
        @Size(max = 20, message = "Severity must be ≤ 20 characters")
        private String severity;
    }
}

