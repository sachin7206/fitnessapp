package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomExerciseEntry {
    private String exerciseName;
    private Integer sets;
    private Integer reps;
    private Double weight;
    private String muscleGroup;
    private Boolean isCardio;
    private Integer durationSeconds;
    private Integer restTimeSeconds;
    private String dayOfWeek;
    private Integer order;
    private Integer caloriesBurned;
    private String setDetailsJson; // JSON: [{"reps":12,"weight":50},...]
}

