package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class WorkoutFeedbackRequest {
    @NotBlank(message = "Difficulty is required")
    @Pattern(regexp = "TOO_EASY|JUST_RIGHT|TOO_HARD", message = "Invalid difficulty value")
    private String difficulty;

    @Min(value = 1, message = "Energy level must be between 1 and 10")
    @Max(value = 10, message = "Energy level must be between 1 and 10")
    private int energyLevel;

    @Min(value = 0, message = "Completion percentage must be between 0 and 100")
    @Max(value = 100, message = "Completion percentage must be between 0 and 100")
    private int completionPercentage;

    @Size(max = 1000, message = "Notes must be ≤ 1000 characters")
    private String notes;
}

