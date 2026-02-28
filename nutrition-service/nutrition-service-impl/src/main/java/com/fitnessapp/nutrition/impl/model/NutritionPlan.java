package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "nutrition_plans")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class NutritionPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Column(length = 1000) private String description;
    @Column(nullable = false) private String region;
    @Column(nullable = false) private String dietType;
    @Column(nullable = false) private String goal;
    private Integer totalCalories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private Double fiberGrams;
    @Column(nullable = false) private String difficulty;
    private Integer durationDays;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "nutrition_plan_id")
    private Set<Meal> meals = new HashSet<>();
    private Boolean isActive = true;
    @CreatedDate @Column(updatable = false) private LocalDateTime createdAt;
    @LastModifiedDate private LocalDateTime updatedAt;
}

