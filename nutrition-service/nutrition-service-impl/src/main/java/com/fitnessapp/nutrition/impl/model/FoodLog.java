package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "food_log")
@Data @NoArgsConstructor @AllArgsConstructor
public class FoodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate logDate;

    private String mealType;
    private String description;
    private String source; // PHOTO or MANUAL

    private int totalCalories;
    private double totalProtein;
    private double totalCarbs;
    private double totalFat;
    private double confidence;

    @Column(columnDefinition = "TEXT")
    private String foodItemsJson;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (logDate == null) logDate = LocalDate.now();
    }
}
