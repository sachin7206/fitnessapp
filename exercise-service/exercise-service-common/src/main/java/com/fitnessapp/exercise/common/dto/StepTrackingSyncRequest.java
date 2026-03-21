package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StepTrackingSyncRequest {
    @NotNull(message = "Steps is required")
    @Min(value = 0, message = "Steps must be ≥ 0")
    @Max(value = 200000, message = "Steps must be ≤ 200,000")
    private Integer steps;

    @Min(value = 0, message = "Step goal must be ≥ 0")
    @Max(value = 200000, message = "Step goal must be ≤ 200,000")
    private Integer stepGoal;

    private Boolean goalCompleted;
}

