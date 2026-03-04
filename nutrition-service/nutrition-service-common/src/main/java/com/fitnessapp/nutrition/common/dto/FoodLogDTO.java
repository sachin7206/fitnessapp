package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class FoodLogDTO {
    private Long id;
    private LocalDate logDate;
    private String mealType;
    private String description;
    private String source;
    private int totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFat;
    private double confidence;
    private List<Object> foodItems;
    private LocalDateTime createdAt;
}

