package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutExerciseDTO {
    private Long id;
    private Long exerciseId;
    private String exerciseName;
    private Integer sets;
    private Integer reps;
    private Integer durationSeconds;
    private Integer restTimeSeconds;
    private Integer order;
    private String dayOfWeek;
    private String muscleGroup;
    private Integer caloriesBurned;
    private Boolean isCardio;
    private Integer steps;
}

