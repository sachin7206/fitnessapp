package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateWorkoutPlanRequest {
    @NotNull(message = "Days per week is required")
    @Min(value = 1, message = "Days per week must be at least 1")
    @Max(value = 7, message = "Days per week must be at most 7")
    private Integer daysPerWeek;

    @Pattern(regexp = "GYM|OUTDOOR|RUNNING|YOGA|HOME", message = "Invalid exercise type")
    private String exerciseType;

    @Size(max = 20, message = "Exercise time must be ≤ 20 characters")
    private String exerciseTime;

    @Min(value = 10, message = "Duration must be at least 10 minutes")
    @Max(value = 180, message = "Duration must be at most 180 minutes")
    private Integer durationMinutes;

    @Pattern(regexp = "MUSCLE_BUILDING|SLIMMING|SLIMMING_PLUS_MUSCLE", message = "Invalid goal")
    private String goal;

    @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED", message = "Invalid difficulty")
    private String difficulty;

    private Boolean includeCardio;

    @Pattern(regexp = "RUNNING|WALKING|CYCLING|SKIPPING", message = "Invalid cardio type")
    private String cardioType;

    @Min(value = 5, message = "Cardio duration must be at least 5 minutes")
    @Max(value = 120, message = "Cardio duration must be at most 120 minutes")
    private Integer cardioDurationMinutes;

    @Min(value = 0, message = "Cardio steps must be ≥ 0")
    @Max(value = 100000, message = "Cardio steps must be ≤ 100,000")
    private Integer cardioSteps;

    private List<String> focusMuscleGroups;

    // Custom exercises provided by user for AI plan generation
    private List<CustomExerciseInput> customExercises;

    // Workout split type: SINGLE_MUSCLE, DOUBLE_MUSCLE, PUSH_PULL_LEGS, UPPER_LOWER, FULL_BODY
    @Pattern(regexp = "SINGLE_MUSCLE|DOUBLE_MUSCLE|PUSH_PULL_LEGS|UPPER_LOWER|FULL_BODY",
             message = "Invalid split type")
    private String splitType;

    // Plan name and workout days
    private String planName;
    private List<String> workoutDays;
    private String restDay;

    // Plan generation limit (from subscription)
    private Integer maxPlanGenerations;
    private String subscriptionStartDate; // YYYY-MM-DD format

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomExerciseInput {
        private String dayOfWeek;
        private String exerciseName;
        private String muscleGroup;
        private Integer sets;
        private Integer reps;
        private Double weight;
        private Boolean isCardio;
        private Integer durationMinutes;
    }
}

