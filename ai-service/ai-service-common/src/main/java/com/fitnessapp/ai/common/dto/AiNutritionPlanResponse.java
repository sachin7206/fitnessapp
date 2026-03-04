package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * AI-generated nutrition plan response containing meals and food items.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiNutritionPlanResponse {
    private List<AiMeal> meals;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AiMeal {
        private String name;
        private String mealType;
        private String timeOfDay;
        private Integer calories;
        private String preparationTips;
        private List<AiFoodItem> foodItems;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AiFoodItem {
        private String name;
        private String description;
        private String quantity;
        private String region;
        private Integer calories;
        private Double proteinGrams;
        private Double carbsGrams;
        private Double fatGrams;
        private Double fiberGrams;
        private Boolean isVegetarian;
    }
}

