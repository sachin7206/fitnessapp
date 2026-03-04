package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Request DTO for generating a nutrition plan via AI.
 * Contains all information needed to build the Gemini prompt.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiNutritionPlanRequest {
    private String dietType;
    private String goal;
    private int targetCalories;
    private String region;

    // User info for context
    private Integer age;
    private String gender;
    private Double weight;
    private Double height;

    // Food preferences
    private List<MealSlot> mealSlots;
    private FoodPrefs foodPreferences;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class MealSlot {
        private String name;
        private String type;
        private String time;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FoodPrefs {
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
}

