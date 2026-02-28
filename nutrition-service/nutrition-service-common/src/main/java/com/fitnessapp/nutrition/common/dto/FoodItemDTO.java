package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class FoodItemDTO {
    private Long id;
    private String name;
    private String hindiName;
    private String regionalName;
    private String description;
    private String quantity;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private Double fiberGrams;
    private String ingredients;
    private String recipe;
    private String imageUrl;
    private Boolean isVegetarian;
    private Boolean isVegan;
    private Boolean isGlutenFree;
    private Boolean isDairyFree;
    private Boolean isJainFriendly;
    private String region;
}

