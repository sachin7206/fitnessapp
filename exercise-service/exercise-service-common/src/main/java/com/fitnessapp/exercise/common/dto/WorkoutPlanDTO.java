package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanDTO {
    private Long id;
    private Long userId;
    private String planName;
    private String planType;
    private List<WorkoutExerciseDTO> exercises;
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
}

