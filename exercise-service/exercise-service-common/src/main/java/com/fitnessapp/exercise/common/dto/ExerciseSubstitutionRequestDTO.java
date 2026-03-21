package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ExerciseSubstitutionRequestDTO {
    @NotBlank(message = "Exercise name is required")
    @Size(max = 200, message = "Exercise name must be ≤ 200 characters")
    private String exerciseName;

    @Size(max = 50, message = "Muscle group must be ≤ 50 characters")
    private String muscleGroup;

    @Size(max = 500, message = "Reason must be ≤ 500 characters")
    private String reason;

    @Size(max = 20, message = "Maximum 20 equipment items")
    private List<@Size(max = 100) String> availableEquipment;

    @Size(max = 20, message = "Maximum 20 injured body parts")
    private List<@Size(max = 100) String> injuredBodyParts;
}

