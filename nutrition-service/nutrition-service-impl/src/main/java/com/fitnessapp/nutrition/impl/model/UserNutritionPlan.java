package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "user_nutrition_plans")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UserNutritionPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "nutrition_plan_id", nullable = false)
    private NutritionPlan nutritionPlan;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer currentDay = 1;
    @Column(nullable = false) private String status;
    private Integer completedMeals = 0;
    private Integer totalMeals = 0;
    private Double adherencePercentage = 0.0;
    @Column(length = 500) private String notes;
    @CreatedDate @Column(updatable = false) private LocalDateTime enrolledAt;
}

