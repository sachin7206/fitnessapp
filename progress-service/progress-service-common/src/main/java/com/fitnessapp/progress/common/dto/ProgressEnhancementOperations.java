package com.fitnessapp.progress.common.dto;

public interface ProgressEnhancementOperations {
    WeeklyReportDTO getWeeklyReport(Long userId);
    PlateauAnalysisDTO getPlateauAnalysis(Long userId, int days);
    AchievementsDTO getAchievements(Long userId);
}
