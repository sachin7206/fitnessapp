package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyStepTrackingDTO {
    private Long id;
    private String userEmail;
    private LocalDate trackingDate;
    private Integer steps;
    private Integer stepGoal;
    private Integer caloriesBurned;
    private Boolean goalCompleted;
}

