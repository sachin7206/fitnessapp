package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiWeeklyReportResponse {
    private String summary;
    private List<String> highlights;
    private List<String> concerns;
    private List<String> recommendations;
    private int overallScore;
    private boolean fromAi;
}

