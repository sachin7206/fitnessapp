package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExerciseRequest {
    @Min(value = 1, message = "Sets must be at least 1")
    @Max(value = 50, message = "Sets must be at most 50")
    private Integer sets;

    @Min(value = 1, message = "Reps must be at least 1")
    @Max(value = 500, message = "Reps must be at most 500")
    private Integer reps;

    @DecimalMin(value = "0.0", message = "Weight must be ≥ 0")
    @DecimalMax(value = "1000.0", message = "Weight must be ≤ 1000 kg")
    private Double weight;

    @Min(value = 0, message = "Rest time must be ≥ 0 seconds")
    @Max(value = 600, message = "Rest time must be ≤ 600 seconds")
    private Integer restTimeSeconds;

    @Size(max = 5000, message = "Set details JSON must be ≤ 5000 characters")
    private String setDetailsJson;

    @Min(value = 0, message = "Duration must be ≥ 0 seconds")
    @Max(value = 86400, message = "Duration must be ≤ 86400 seconds")
    private Integer durationSeconds;
}

