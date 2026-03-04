package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic AI text generation request (for free-form prompts).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiTextRequest {
    private String prompt;
    private boolean jsonResponse;
}

