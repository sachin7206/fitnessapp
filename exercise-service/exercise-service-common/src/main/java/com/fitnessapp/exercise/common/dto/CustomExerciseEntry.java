package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomExerciseEntry {
    @NotBlank(message = "Exercise name is required")
    @Size(min = 1, max = 200, message = "Exercise name must be between 1 and 200 characters")
    private String exerciseName;

    @Min(value = 1, message = "Sets must be at least 1")
    @Max(value = 50, message = "Sets must be at most 50")
    private Integer sets;

    @Min(value = 1, message = "Reps must be at least 1")
    @Max(value = 500, message = "Reps must be at most 500")
    private Integer reps;

    @DecimalMin(value = "0.0", message = "Weight must be ≥ 0")
    @DecimalMax(value = "1000.0", message = "Weight must be ≤ 1000 kg")
    private Double weight;

    @Size(max = 50, message = "Muscle group must be ≤ 50 characters")
    private String muscleGroup;

    private Boolean isCardio;

    @Min(value = 0, message = "Duration must be ≥ 0 seconds")
    @Max(value = 86400, message = "Duration must be ≤ 86400 seconds")
    private Integer durationSeconds;

    @Min(value = 0, message = "Rest time must be ≥ 0 seconds")
    @Max(value = 600, message = "Rest time must be ≤ 600 seconds")
    private Integer restTimeSeconds;

    @NotBlank(message = "Day of week is required")
    @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY",
             message = "Invalid day of week")
    private String dayOfWeek;

    @Min(value = 1, message = "Order must be at least 1")
    @Max(value = 100, message = "Order must be at most 100")
    private Integer order;

    @Min(value = 0, message = "Calories burned must be ≥ 0")
    @Max(value = 5000, message = "Calories burned must be ≤ 5000")
    private Integer caloriesBurned;

    @Size(max = 5000, message = "Set details JSON must be ≤ 5000 characters")
    private String setDetailsJson;
}

