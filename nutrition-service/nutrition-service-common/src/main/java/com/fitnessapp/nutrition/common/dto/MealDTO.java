package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class MealDTO {
    private Long id;
    private String name;
    private String mealType;
    private String timeOfDay;
    private Integer dayNumber;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private List<FoodItemDTO> foodItems;
    private String preparationTips;
    private String indianAlternatives;
}

