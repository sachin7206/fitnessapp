package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiMealSwapResponse {
    private List<MealAlternative> alternatives;
    private boolean fromAi;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class MealAlternative {
        private String mealName;
        private String description;
        private int calories;
        private double proteinGrams;
        private double carbsGrams;
        private double fatGrams;
        private double calorieDeviation;
        private List<AiNutritionPlanResponse.AiFoodItem> foodItems;
    }
}

