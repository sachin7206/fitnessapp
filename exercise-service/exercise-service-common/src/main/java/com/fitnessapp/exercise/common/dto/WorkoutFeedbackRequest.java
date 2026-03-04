package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class WorkoutFeedbackRequest {
    private String difficulty; // TOO_EASY, JUST_RIGHT, TOO_HARD
    private int energyLevel;
    private int completionPercentage;
    private String notes;
}

