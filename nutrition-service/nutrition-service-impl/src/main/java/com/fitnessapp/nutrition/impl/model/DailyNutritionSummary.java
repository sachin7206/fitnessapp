package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_nutrition_summary",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_email", "tracking_date"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyNutritionSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "tracking_date")
    private LocalDate trackingDate;
    private Integer consumedCalories;
    private Double consumedProtein;
    private Double consumedCarbs;
    private Double consumedFat;
    private Integer totalMeals;
    private Integer completedMeals;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

