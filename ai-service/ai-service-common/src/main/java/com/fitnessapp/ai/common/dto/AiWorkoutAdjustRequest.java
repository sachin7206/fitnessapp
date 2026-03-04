package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiWorkoutAdjustRequest {
    private List<Object> currentExercises;
    private List<Object> feedbackHistory;
    private String goal;
    private int currentWeek;
}

