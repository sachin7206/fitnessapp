package com.fitnessapp.exercise.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_completions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutCompletion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_workout_plan_id")
    private UserWorkoutPlan userWorkoutPlan;

    private LocalDate completionDate;
    private Boolean completed;
    private LocalDateTime completedAt;
}

