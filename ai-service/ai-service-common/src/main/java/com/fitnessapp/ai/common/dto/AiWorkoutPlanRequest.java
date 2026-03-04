package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Request DTO for generating a workout plan via AI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiWorkoutPlanRequest {
    private Integer daysPerWeek;
    private String exerciseType;    // GYM, OUTDOOR, RUNNING, YOGA, HOME
    private String exerciseTime;    // "6:00 AM"
    private Integer durationMinutes;
    private String goal;            // MUSCLE_BUILDING, SLIMMING, SLIMMING_PLUS_MUSCLE
    private String difficulty;      // BEGINNER, INTERMEDIATE, ADVANCED
    private Boolean includeCardio;
    private String cardioType;      // RUNNING, WALKING, CYCLING, SKIPPING
    private Integer cardioDurationMinutes;
    private Integer cardioSteps;
    private List<String> focusMuscleGroups;
}

