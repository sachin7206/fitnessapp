package com.fitnessapp.exercise.common.dto;

public interface AIBasedWorkoutOperations {
    WorkoutPlanDTO generatePersonalizedWorkoutPlan(Long userId, GenerateWorkoutPlanRequest request);
    String getMotivationalQuote(Long userId);
}
