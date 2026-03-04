package com.fitnessapp.ai.common.dto;

/**
 * Contract for AI service operations.
 */
public interface AiOperations {

    /** Generate a nutrition meal plan using AI. */
    AiNutritionPlanResponse generateNutritionPlan(AiNutritionPlanRequest request);

    /** Estimate macros for a food item description. */
    AiEstimateMacrosResponse estimateFoodMacros(AiEstimateMacrosRequest request);

    /** Generate workout exercises using AI. */
    AiWorkoutPlanResponse generateWorkoutPlan(AiWorkoutPlanRequest request);

    /** Generate a motivational quote using AI. */
    AiMotivationalQuoteResponse generateMotivationalQuote();

    /** Generate a wellness plan using AI. */
    AiWellnessPlanResponse generateWellnessPlan(AiWellnessPlanRequest request);

    /** Generic text generation (for custom prompts). */
    AiTextResponse generateText(AiTextRequest request);

    /** Check if AI service is available. */
    boolean isAvailable();
}

