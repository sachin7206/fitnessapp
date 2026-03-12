package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExerciseRequest {
    private Integer sets;
    private Integer reps;
    private Double weight;
    private Integer restTimeSeconds;
    private String setDetailsJson;
    private Integer durationSeconds;
}

