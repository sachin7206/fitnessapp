package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class PlateauAnalysisDTO {
    private boolean isPlateauDetected;
    private String plateauType;
    private int durationWeeks;
    private String analysis;
    private List<String> suggestions;
    private boolean fromAi;
}

