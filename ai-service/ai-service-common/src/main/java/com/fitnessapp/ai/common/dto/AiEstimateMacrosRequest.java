package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to estimate macros for a food item described in free text.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiEstimateMacrosRequest {
    private String foodDescription;
}

