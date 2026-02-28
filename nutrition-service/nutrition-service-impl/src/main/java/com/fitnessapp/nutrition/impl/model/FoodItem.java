package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "food_items")
@Data @NoArgsConstructor @AllArgsConstructor
public class FoodItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    private String hindiName;
    private String regionalName;
    @Column(length = 500) private String description;
    private String quantity;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private Double fiberGrams;
    @Column(length = 1000) private String ingredients;
    @Column(length = 1000) private String recipe;
    private String imageUrl;
    private Boolean isVegetarian = true;
    private Boolean isVegan = false;
    private Boolean isGlutenFree = false;
    private Boolean isDairyFree = false;
    private Boolean isJainFriendly = false;
    private String region;
}

