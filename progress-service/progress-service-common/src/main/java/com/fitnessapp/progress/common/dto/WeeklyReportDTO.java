package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class WeeklyReportDTO {
    private String summary;
    private List<String> highlights;
    private List<String> concerns;
    private List<String> recommendations;
    private int overallScore;
    private boolean fromAi;
    private LocalDate weekStartDate;
}

