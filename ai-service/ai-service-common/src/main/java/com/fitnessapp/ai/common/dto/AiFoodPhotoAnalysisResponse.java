package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiFoodPhotoAnalysisResponse {
    private List<RecognizedFoodItem> foodItems;
    private int totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFat;
    private double confidence;
    private boolean fromAi;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RecognizedFoodItem {
        private String name;
        private String quantity;
        private int calories;
        private double proteinGrams;
        private double carbsGrams;
        private double fatGrams;
    }
}

