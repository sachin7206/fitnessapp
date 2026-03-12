package com.fitnessapp.exercise.common.dto;

public interface AIBasedWorkoutOperations {
    WorkoutPlanDTO generatePersonalizedWorkoutPlan(String email, Long userId, GenerateWorkoutPlanRequest request);
    String getMotivationalQuote(String email);
}

