package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class WorkoutAdjustmentResponseDTO {
    private List<Object> adjustedExercises;
    private String reasoning;
    private boolean fromAi;
}

