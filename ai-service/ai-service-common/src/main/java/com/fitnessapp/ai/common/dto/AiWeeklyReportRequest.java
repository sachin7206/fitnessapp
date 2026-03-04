package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiWeeklyReportRequest {
    private String userName;
    private String weekStartDate;
    private List<Object> weightEntries;
    private int workoutCompletions;
    private int totalWorkoutsPlanned;
    private double mealAdherencePercent;
    private int totalSteps;
    private int caloriesConsumed;
    private int caloriesTarget;
    private List<String> goals;
}

