package com.fitnessapp.wellness.common.dto;

import java.util.List;
import java.util.Map;

public interface WellnessOperations {
    List<YogaPoseDTO> getYogaPoses(String difficulty);
    List<MeditationSessionDTO> getMeditationSessions(String type);
    List<BreathingExerciseDTO> getBreathingExercises();
    WellnessPlanDTO generatePlan(Long userId, Map<String, Object> request);
    UserWellnessPlanDTO assignPlan(Long userId, Long planId);
    UserWellnessPlanDTO getMyPlan(Long userId);
    UserWellnessPlanDTO completeSession(Long userId, String sessionType, Long sessionId, Integer durationMinutes);
    WellnessTipDTO getDailyTip();
    WellnessStreakDTO getStreak(Long userId);
    List<Map<String, Object>> getTodayCompletions(Long userId);
}

