package com.fitnessapp.exercise.common.dto;

public interface ExerciseEnhancementOperations {
    ExerciseSubstitutionResponseDTO suggestExerciseSubstitutes(Long userId, ExerciseSubstitutionRequestDTO request);
}
