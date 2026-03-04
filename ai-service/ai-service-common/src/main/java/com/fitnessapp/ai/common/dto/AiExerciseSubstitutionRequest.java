package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiExerciseSubstitutionRequest {
    private String exerciseName;
    private String muscleGroup;
    private String reason; // EQUIPMENT, INJURY, PREFERENCE
    private List<String> availableEquipment;
    private List<String> injuredBodyParts;
}

