package com.fitnessapp.exercise.common.dto;

import java.util.List;

public interface WorkoutTrackingOperations {
    UserWorkoutPlanDTO getActiveWorkoutPlan(String email);
    UserWorkoutPlanDTO assignWorkoutPlan(String email, Long planId);
    UserWorkoutPlanDTO markWorkoutComplete(String email);
    Integer getWorkoutCount(String email);
    void cancelPlan(String email);
}

