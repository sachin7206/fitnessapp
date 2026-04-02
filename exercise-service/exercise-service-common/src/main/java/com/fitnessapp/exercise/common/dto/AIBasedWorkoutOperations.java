package com.fitnessapp.exercise.common.dto;

import java.time.LocalDateTime;

public interface AIBasedWorkoutOperations {
    WorkoutPlanDTO generatePersonalizedWorkoutPlan(Long userId, GenerateWorkoutPlanRequest request);
    String getMotivationalQuote(Long userId);
    long getAiPlanCount(Long userId, LocalDateTime since);
}
