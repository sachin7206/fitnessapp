package com.fitnessapp.ai.impl.validation;

import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for AI service operations.
 */
@Component
public class AiValidator {

    /**
     * Validate that the Gemini API keys are configured.
     */
    public void validateApiKeysConfigured(boolean hasKeys) {
        if (!hasKeys) {
            throw new RuntimeException("No Gemini API keys configured");
        }
    }

    /**
     * Validate that the AI response was parsed successfully.
     */
    public void validateAiResponseParsed(Object response, String context) {
        if (response == null) {
            throw new RuntimeException("Failed to parse AI response: " + context);
        }
    }
}

