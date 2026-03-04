package com.fitnessapp.exercise.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_feedback")
@Data @NoArgsConstructor @AllArgsConstructor
public class WorkoutFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    private Long workoutPlanId;
    private String difficulty; // TOO_EASY, JUST_RIGHT, TOO_HARD
    private int energyLevel;
    private int completionPercentage;
    private String notes;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}

