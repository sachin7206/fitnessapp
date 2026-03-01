package com.fitnessapp.wellness.common.dto;

import java.util.List;
import java.util.Map;

public interface WellnessOperations {
    List<YogaPoseDTO> getYogaPoses(String difficulty);
    List<MeditationSessionDTO> getMeditationSessions(String type);
    List<BreathingExerciseDTO> getBreathingExercises();
    WellnessPlanDTO generatePlan(String email, Map<String, Object> request);
    UserWellnessPlanDTO assignPlan(String email, Long planId);
    UserWellnessPlanDTO getMyPlan(String email);
    UserWellnessPlanDTO completeSession(String email, String sessionType, Long sessionId, Integer durationMinutes);
    WellnessTipDTO getDailyTip();
    WellnessStreakDTO getStreak(String email);
}

