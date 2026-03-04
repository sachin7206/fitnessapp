package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ExerciseSubstitutionRequestDTO {
    private String exerciseName;
    private String muscleGroup;
    private String reason;
    private List<String> availableEquipment;
    private List<String> injuredBodyParts;
}

