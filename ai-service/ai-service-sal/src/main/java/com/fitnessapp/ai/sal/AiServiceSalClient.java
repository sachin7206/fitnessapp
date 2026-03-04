package com.fitnessapp.ai.sal;

import com.fitnessapp.ai.common.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestTemplate;

/**
 * Service Abstraction Layer client for calling AI Service APIs.
 * Uses RestTemplate with Eureka-resolved URLs.
 */
@Slf4j
@RequiredArgsConstructor
public class AiServiceSalClient {

    private final RestTemplate restTemplate;
    private final String baseUrl; // e.g., "http://ai-service"

    /**
     * Generate a nutrition meal plan via AI.
     */
    public AiNutritionPlanResponse generateNutritionPlan(AiNutritionPlanRequest request) {
        log.debug("SAL: Calling AI service to generate nutrition plan");
        return restTemplate.postForObject(
                baseUrl + "/ai/nutrition/generate-plan",
                request, AiNutritionPlanResponse.class);
    }

    /**
     * Estimate macros for a food description.
     */
    public AiEstimateMacrosResponse estimateFoodMacros(String foodDescription) {
        log.debug("SAL: Calling AI service to estimate macros for: {}", foodDescription);
        AiEstimateMacrosRequest req = new AiEstimateMacrosRequest(foodDescription);
        return restTemplate.postForObject(
                baseUrl + "/ai/nutrition/estimate-macros",
                req, AiEstimateMacrosResponse.class);
    }

    /**
     * Analyze food photo to recognize items and estimate macros.
     */
    public AiFoodPhotoAnalysisResponse analyzeFoodPhoto(AiFoodPhotoAnalysisRequest request) {
        log.debug("SAL: Calling AI service for food photo analysis");
        return restTemplate.postForObject(
                baseUrl + "/ai/nutrition/analyze-food-photo",
                request, AiFoodPhotoAnalysisResponse.class);
    }

    /**
     * Suggest meal swap alternatives with matching macros.
     */
    public AiMealSwapResponse suggestMealSwap(AiMealSwapRequest request) {
        log.debug("SAL: Calling AI service for meal swap suggestions");
        return restTemplate.postForObject(
                baseUrl + "/ai/nutrition/suggest-meal-swap",
                request, AiMealSwapResponse.class);
    }

    /**
     * Generate grocery list from meal plan.
     */
    public AiGroceryListResponse generateGroceryList(AiGroceryListRequest request) {
        log.debug("SAL: Calling AI service for grocery list generation");
        return restTemplate.postForObject(
                baseUrl + "/ai/nutrition/generate-grocery-list",
                request, AiGroceryListResponse.class);
    }

    /**
     * Generate workout exercises via AI.
     */
    public AiWorkoutPlanResponse generateWorkoutPlan(AiWorkoutPlanRequest request) {
        log.debug("SAL: Calling AI service to generate workout plan");
        return restTemplate.postForObject(
                baseUrl + "/ai/workout/generate-plan",
                request, AiWorkoutPlanResponse.class);
    }

    /**
     * Generate a motivational quote via AI.
     */
    public AiMotivationalQuoteResponse getMotivationalQuote() {
        log.debug("SAL: Calling AI service for motivational quote");
        return restTemplate.getForObject(
                baseUrl + "/ai/workout/motivational-quote",
                AiMotivationalQuoteResponse.class);
    }

    /**
     * Suggest exercise substitutions via AI.
     */
    public AiExerciseSubstitutionResponse suggestExerciseSubstitutes(AiExerciseSubstitutionRequest request) {
        log.debug("SAL: Calling AI service for exercise substitutions");
        return restTemplate.postForObject(
                baseUrl + "/ai/workout/suggest-substitutes",
                request, AiExerciseSubstitutionResponse.class);
    }

    /**
     * Adjust workout progression based on feedback via AI.
     */
    public AiWorkoutAdjustResponse adjustWorkoutProgression(AiWorkoutAdjustRequest request) {
        log.debug("SAL: Calling AI service for workout adjustment");
        return restTemplate.postForObject(
                baseUrl + "/ai/workout/adjust-progression",
                request, AiWorkoutAdjustResponse.class);
    }

    /**
     * Generate a wellness plan via AI.
     */
    public AiWellnessPlanResponse generateWellnessPlan(AiWellnessPlanRequest request) {
        log.debug("SAL: Calling AI service to generate wellness plan");
        return restTemplate.postForObject(
                baseUrl + "/ai/wellness/generate-plan",
                request, AiWellnessPlanResponse.class);
    }

    /**
     * Analyze rest day recommendation via AI.
     */
    public AiRestDayResponse analyzeRestDay(AiRestDayRequest request) {
        log.debug("SAL: Calling AI service for rest day analysis");
        return restTemplate.postForObject(
                baseUrl + "/ai/wellness/rest-day-analysis",
                request, AiRestDayResponse.class);
    }

    /**
     * Generate weekly progress report via AI.
     */
    public AiWeeklyReportResponse generateWeeklyReport(AiWeeklyReportRequest request) {
        log.debug("SAL: Calling AI service for weekly report");
        return restTemplate.postForObject(
                baseUrl + "/ai/progress/weekly-report",
                request, AiWeeklyReportResponse.class);
    }

    /**
     * Detect fitness plateau via AI.
     */
    public AiPlateauDetectionResponse detectPlateau(AiPlateauDetectionRequest request) {
        log.debug("SAL: Calling AI service for plateau detection");
        return restTemplate.postForObject(
                baseUrl + "/ai/progress/detect-plateau",
                request, AiPlateauDetectionResponse.class);
    }

    /**
     * Generate text from a custom prompt.
     */
    public AiTextResponse generateText(String prompt, boolean jsonResponse) {
        log.debug("SAL: Calling AI service for text generation");
        AiTextRequest req = new AiTextRequest(prompt, jsonResponse);
        return restTemplate.postForObject(
                baseUrl + "/ai/text/generate",
                req, AiTextResponse.class);
    }

    /**
     * Check if AI service is available and healthy.
     */
    public boolean isAvailable() {
        try {
            @SuppressWarnings("unchecked")
            var response = restTemplate.getForObject(baseUrl + "/ai/health", java.util.Map.class);
            return response != null && Boolean.TRUE.equals(response.get("aiAvailable"));
        } catch (Exception e) {
            log.warn("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }
}

