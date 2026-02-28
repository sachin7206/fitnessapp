package com.fitnessapp.nutrition.impl.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "user_food_preferences")
@EntityListeners(AuditingEntityListener.class)
@Data @NoArgsConstructor @AllArgsConstructor
public class UserFoodPreference {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", unique = true, nullable = false) private Long userId;
    private Boolean includeChicken;
    private Boolean includeFish;
    private Boolean includeRedMeat;
    private Integer eggsPerDay;
    private Boolean includeRice;
    private Boolean includeRoti;
    private Boolean includeDal;
    private Boolean includeMilk;
    private Boolean includePaneer;
    private Boolean includeCurd;
    private String cookingOilPreference;
    private Boolean preferHomemade;
    @ElementCollection @CollectionTable(name = "user_food_allergies", joinColumns = @JoinColumn(name = "food_pref_id"))
    @Column(name = "allergy") private List<String> allergies = new ArrayList<>();
    @ElementCollection @CollectionTable(name = "user_disliked_foods", joinColumns = @JoinColumn(name = "food_pref_id"))
    @Column(name = "food") private List<String> dislikedFoods = new ArrayList<>();
    @Column(columnDefinition = "TEXT") private String customMealsJson;
    private Boolean includePreWorkout;
    private String preWorkoutTime;
    private Boolean includePostWorkout;
    private String postWorkoutTime;
    private Boolean canTakeWheyProtein;
    @ElementCollection @CollectionTable(name = "user_supplements", joinColumns = @JoinColumn(name = "food_pref_id"))
    @Column(name = "supplement") private List<String> supplements = new ArrayList<>();
    private String region;
    @CreatedDate @Column(updatable = false) private LocalDateTime createdAt;
    @LastModifiedDate private LocalDateTime updatedAt;
}

