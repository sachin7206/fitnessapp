package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ExerciseSubstitutionResponseDTO {
    private String originalExercise;
    private List<Object> alternatives;
    private boolean fromAi;
}

