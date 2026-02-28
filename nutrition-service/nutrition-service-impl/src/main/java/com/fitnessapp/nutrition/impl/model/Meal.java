package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.HashSet;
import java.util.Set;

@Entity @Table(name = "meals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Meal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String mealType;
    private String timeOfDay;
    private Integer dayNumber;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_id")
    private Set<FoodItem> foodItems = new HashSet<>();
    @Column(length = 500) private String preparationTips;
    @Column(length = 500) private String indianAlternatives;
}

