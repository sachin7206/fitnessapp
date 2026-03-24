package com.fitnessapp.exercise.common.dto;

import java.util.List;

public interface WorkoutTrackingOperations {
    UserWorkoutPlanDTO getActiveWorkoutPlan(Long userId);
    UserWorkoutPlanDTO assignWorkoutPlan(Long userId, Long planId);
    UserWorkoutPlanDTO markWorkoutComplete(Long userId);
    UserWorkoutPlanDTO markWorkoutUncomplete(Long userId);
    Integer getWorkoutCount(Long userId);
    void cancelPlan(Long userId);

    // Step tracking
    DailyStepTrackingDTO syncSteps(Long userId, StepTrackingSyncRequest request);
    DailyStepTrackingDTO getTodaySteps(Long userId);
    List<DailyStepTrackingDTO> getStepHistory(Long userId, int days);
}
