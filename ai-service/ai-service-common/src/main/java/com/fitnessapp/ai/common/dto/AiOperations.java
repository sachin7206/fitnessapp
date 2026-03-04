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

    // ========== NEW FEATURE OPERATIONS ==========

    /** Analyze food photo to recognize items and estimate macros. */
    AiFoodPhotoAnalysisResponse analyzeFoodPhoto(AiFoodPhotoAnalysisRequest request);

    /** Suggest exercise substitutions. */
    AiExerciseSubstitutionResponse suggestExerciseSubstitutes(AiExerciseSubstitutionRequest request);

    /** Generate weekly progress report. */
    AiWeeklyReportResponse generateWeeklyReport(AiWeeklyReportRequest request);

    /** Detect fitness plateau. */
    AiPlateauDetectionResponse detectPlateau(AiPlateauDetectionRequest request);

    /** Suggest meal swaps with matching macros. */
    AiMealSwapResponse suggestMealSwap(AiMealSwapRequest request);

    /** Adjust workout progression based on feedback. */
    AiWorkoutAdjustResponse adjustWorkoutProgression(AiWorkoutAdjustRequest request);

    /** Analyze rest day recommendation. */
    AiRestDayResponse analyzeRestDay(AiRestDayRequest request);

    /** Generate grocery list from meal plan. */
    AiGroceryListResponse generateGroceryList(AiGroceryListRequest request);
}

