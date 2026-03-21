package com.fitnessapp.progress.common.dto;

import java.util.List;

public interface ProgressTrackingOperations {
    WeightEntryDTO logWeight(Long userId, Double weight, String unit, Double bmi, Double bodyFatPct, String notes);
    List<WeightEntryDTO> getWeightEntries(Long userId, int days);
    BodyMeasurementDTO logMeasurements(Long userId, BodyMeasurementDTO dto);
    List<BodyMeasurementDTO> getMeasurements(Long userId, int days);
    ProgressGoalDTO setGoal(Long userId, ProgressGoalDTO dto);
    List<ProgressGoalDTO> getGoals(Long userId);
    ProgressSummaryDTO getSummary(Long userId, String period);
    TrendDataDTO getTrends(Long userId, int days);
}
