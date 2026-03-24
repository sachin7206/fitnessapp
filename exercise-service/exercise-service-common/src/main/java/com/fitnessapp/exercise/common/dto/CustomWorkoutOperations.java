package com.fitnessapp.exercise.common.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface CustomWorkoutOperations {
    WorkoutPlanDTO saveCustomWorkoutPlan(Long userId, CustomWorkoutPlanRequest request);
    WorkoutExerciseDTO updateExercise(Long userId, Long exerciseId, UpdateExerciseRequest request);
    Map<String, Object> syncCustomWorkoutLog(Long userId, CustomWorkoutLogSyncRequest request);
    List<CustomWorkoutLogDTO> getCustomWorkoutLogs(Long userId, int days);
    ExerciseReportDTO getExerciseReport(Long userId, LocalDate startDate, LocalDate endDate);
}
