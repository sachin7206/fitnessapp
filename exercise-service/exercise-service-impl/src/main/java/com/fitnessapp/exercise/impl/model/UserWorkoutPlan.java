package com.fitnessapp.exercise.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_workout_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWorkoutPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "workout_plan_id")
    private WorkoutPlan workoutPlan;

    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer completedWorkouts;
    private Integer totalWorkouts;
    private Integer currentWeek;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (completedWorkouts == null) completedWorkouts = 0;
        if (currentWeek == null) currentWeek = 1;
    }
}
