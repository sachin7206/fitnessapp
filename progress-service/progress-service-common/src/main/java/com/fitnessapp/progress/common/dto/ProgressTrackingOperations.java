package com.fitnessapp.progress.common.dto;

import java.util.List;

public interface ProgressTrackingOperations {
    WeightEntryDTO logWeight(String email, Double weight, String unit, Double bmi, Double bodyFatPct, String notes);
    List<WeightEntryDTO> getWeightEntries(String email, int days);
    BodyMeasurementDTO logMeasurements(String email, BodyMeasurementDTO dto);
    List<BodyMeasurementDTO> getMeasurements(String email, int days);
    ProgressGoalDTO setGoal(String email, ProgressGoalDTO dto);
    List<ProgressGoalDTO> getGoals(String email);
    ProgressSummaryDTO getSummary(String email, String period);
    TrendDataDTO getTrends(String email, int days);
}

