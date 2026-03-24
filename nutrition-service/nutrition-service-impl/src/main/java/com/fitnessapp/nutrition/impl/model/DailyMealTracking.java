package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_meal_tracking",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "tracking_date", "meal_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyMealTracking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tracking_date")
    private LocalDate trackingDate;

    @Column(name = "meal_id")
    private Long mealId;
    private String mealName;
    private String mealType;
    private String timeOfDay;
    private Boolean completed;
    private LocalDateTime completedAt;
    private Boolean replaced;
    private String replacedWith;
    private String originalName;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private Integer originalCalories;
    private Double originalProteinGrams;
    private Double originalCarbsGrams;
    private Double originalFatGrams;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
