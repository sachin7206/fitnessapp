package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiRestDayResponse {
    private boolean shouldRest;
    private String recommendation;
    private List<String> recoveryActivities;
    private int estimatedRecoveryHours;
    private List<String> stretchingSuggestions;
    private boolean fromAi;
}

