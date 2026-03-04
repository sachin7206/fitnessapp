package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiPlateauDetectionRequest {
    private List<Object> weightHistory;
    private List<Object> performanceHistory;
    private String currentGoal;
    private int daysAnalyzed;
}

