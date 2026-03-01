package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ProgressSummaryDTO {
    private String period; // WEEKLY or MONTHLY
    private Double currentWeight;
    private Double weightChange;
    private Double bmi;
    private List<ProgressGoalDTO> activeGoals;
    private BodyMeasurementDTO latestMeasurements;
    private Integer totalEntriesLogged;
    private Integer streakDays;
}

