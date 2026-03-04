package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Estimated macros for a food item, returned by AI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiEstimateMacrosResponse {
    private String name;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
}

