package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI-generated motivational quote.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiMotivationalQuoteResponse {
    private String quote;
    private boolean fromAi;
}

