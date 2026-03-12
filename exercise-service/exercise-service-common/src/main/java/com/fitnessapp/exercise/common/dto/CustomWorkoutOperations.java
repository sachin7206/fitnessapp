package com.fitnessapp.exercise.common.dto;

import java.util.List;
import java.util.Map;

public interface CustomWorkoutOperations {
    WorkoutPlanDTO saveCustomWorkoutPlan(String email, Long userId, CustomWorkoutPlanRequest request);
    WorkoutExerciseDTO updateExercise(String email, Long exerciseId, UpdateExerciseRequest request);
    Map<String, Object> syncCustomWorkoutLog(String email, CustomWorkoutLogSyncRequest request);
    List<CustomWorkoutLogDTO> getCustomWorkoutLogs(String email, int days);
}

