package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiWorkoutAdjustResponse {
    private List<AdjustedExercise> adjustedExercises;
    private String reasoning;
    private boolean fromAi;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AdjustedExercise {
        private String exerciseName;
        private int previousSets;
        private int previousReps;
        private int newSets;
        private int newReps;
        private String changeReason;
    }
}

