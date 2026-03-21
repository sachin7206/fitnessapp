package com.fitnessapp.exercise.common.dto;

import java.util.List;
import java.util.Map;

public interface ExerciseEnhancementOperations {
    ExerciseSubstitutionResponseDTO suggestExerciseSubstitutes(Long userId, ExerciseSubstitutionRequestDTO request);
    Map<String, Object> submitWorkoutFeedback(Long userId, WorkoutFeedbackRequest request);
    WorkoutAdjustmentResponseDTO adjustWorkoutProgression(Long userId);
    List<WorkoutFeedbackDTO> getWorkoutFeedbackHistory(Long userId);
}
