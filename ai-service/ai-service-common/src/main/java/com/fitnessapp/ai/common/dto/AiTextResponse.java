package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic AI text response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiTextResponse {
    private String text;
    private boolean fromAi;
}

