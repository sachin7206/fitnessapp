package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * AI-generated workout exercises response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiWorkoutPlanResponse {
    private List<AiExercise> exercises;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AiExercise {
        private String exerciseName;
        private Integer sets;
        private Integer reps;
        private Integer durationSeconds;
        private Integer restTimeSeconds;
        private String dayOfWeek;
        private String muscleGroup;
        private Integer caloriesBurned;
        private Boolean isCardio;
        private Integer steps;
        private Integer order;
    }
}

