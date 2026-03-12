package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomWorkoutPlanRequest {
    private String planName;
    private String planType;
    private Integer daysPerWeek;
    private String restDay;
    private List<CustomExerciseEntry> exercises;
}

