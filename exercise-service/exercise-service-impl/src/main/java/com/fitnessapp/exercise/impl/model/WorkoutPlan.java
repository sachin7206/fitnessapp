package com.fitnessapp.exercise.impl.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_plans")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String planName;
    private String planType;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "workoutPlan")
    private List<WorkoutExercise> exercises = new ArrayList<>();

    /**
     * Set exercises and maintain bi-directional relationship.
     */
    public void setExercises(List<WorkoutExercise> exercises) {
        this.exercises = exercises != null ? exercises : new ArrayList<>();
        for (WorkoutExercise ex : this.exercises) {
            ex.setWorkoutPlan(this);
        }
    }

    private String frequency;
    private String difficulty;
    private Integer durationWeeks;
    private Boolean isActive;
    private String exerciseType;
    private String exerciseTime;
    private Integer exerciseDurationMinutes;
    private String goal;
    private Integer daysPerWeek;
    private Integer caloriesPerSession;
    private String cardioType;
    private Integer cardioDurationMinutes;
    private Integer cardioSteps;
    private Integer cardioCalories;
    private Boolean isTemplate;
    private String restDay;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Entity
    @Table(name = "workout_exercises")
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutExercise {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private Long exerciseId;
        private String exerciseName;
        private Integer sets;
        private Integer reps;
        private Double weight;
        private Integer durationSeconds;
        private Integer restTimeSeconds;

        @Column(name = "exercise_order")
        private Integer order;

        private String dayOfWeek;
        private String muscleGroup;
        private Integer caloriesBurned;
        private Boolean isCardio;
        private Integer steps;

        @Column(name = "set_details_json", columnDefinition = "TEXT")
        private String setDetailsJson; // JSON: [{"reps":12,"weight":50},{"reps":10,"weight":55}]

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "workout_plan_id")
        @JsonIgnore
        @ToString.Exclude
        @EqualsAndHashCode.Exclude
        private WorkoutPlan workoutPlan;
    }
}
