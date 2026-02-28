package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class NutritionPlanDTO {
    private Long id;
    private String name;
    private String description;
    private String region;
    private String dietType;
    private String goal;
    private Integer totalCalories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private Double fiberGrams;
    private String difficulty;
    private Integer durationDays;
    private List<MealDTO> meals;
    private Boolean isActive;
}

