package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StepTrackingSyncRequest {
    private Integer steps;
    private Integer stepGoal;
    private Boolean goalCompleted;
}

