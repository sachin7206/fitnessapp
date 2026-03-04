package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiExerciseSubstitutionResponse {
    private List<ExerciseAlternative> alternatives;
    private boolean fromAi;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ExerciseAlternative {
        private String exerciseName;
        private String muscleGroup;
        private int sets;
        private int reps;
        private String reason;
        private String equipmentNeeded;
        private String difficultyLevel;
    }
}

