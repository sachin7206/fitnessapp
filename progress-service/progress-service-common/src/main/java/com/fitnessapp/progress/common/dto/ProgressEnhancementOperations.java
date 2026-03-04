package com.fitnessapp.progress.common.dto;

public interface ProgressEnhancementOperations {
    WeeklyReportDTO getWeeklyReport(String email);
    PlateauAnalysisDTO getPlateauAnalysis(String email, int days);
    AchievementsDTO getAchievements(String email);
}

