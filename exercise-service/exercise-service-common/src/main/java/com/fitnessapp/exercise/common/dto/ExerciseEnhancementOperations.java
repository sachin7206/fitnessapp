package com.fitnessapp.exercise.common.dto;

import java.util.List;
import java.util.Map;

public interface ExerciseEnhancementOperations {
    ExerciseSubstitutionResponseDTO suggestExerciseSubstitutes(String email, ExerciseSubstitutionRequestDTO request);
    Map<String, Object> submitWorkoutFeedback(String email, WorkoutFeedbackRequest request);
    WorkoutAdjustmentResponseDTO adjustWorkoutProgression(String email);
    List<WorkoutFeedbackDTO> getWorkoutFeedbackHistory(String email);
}

