package com.fitnessapp.exercise.common.dto;

public interface AIBasedWorkoutOperations {
    WorkoutPlanDTO generatePersonalizedWorkoutPlan(String email, GenerateWorkoutPlanRequest request);
    String getMotivationalQuote(String email);
}

