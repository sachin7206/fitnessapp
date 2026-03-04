package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class WorkoutFeedbackDTO {
    private Long id;
    private String difficulty;
    private int energyLevel;
    private int completionPercentage;
    private String notes;
    private LocalDateTime createdAt;
}

