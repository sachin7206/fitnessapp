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
     * Generate a wellness plan via AI.
     */
    public AiWellnessPlanResponse generateWellnessPlan(AiWellnessPlanRequest request) {
        log.debug("SAL: Calling AI service to generate wellness plan");
        return restTemplate.postForObject(
                baseUrl + "/ai/wellness/generate-plan",
                request, AiWellnessPlanResponse.class);
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

