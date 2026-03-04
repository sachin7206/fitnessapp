package com.fitnessapp.ai.rest.controller;

import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.rest.api.AiNutritionApi;
import com.fitnessapp.ai.rest.api.AiWorkoutApi;
import com.fitnessapp.ai.rest.api.AiWellnessApi;
import com.fitnessapp.ai.rest.api.AiTextApi;
import com.fitnessapp.ai.rest.api.HealthApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * REST controller exposing all AI endpoints.
 * Implements the OpenAPI-generated interfaces.
 */
@RestController
@RequiredArgsConstructor
public class AiController implements AiNutritionApi, AiWorkoutApi, AiWellnessApi, AiTextApi, HealthApi {

    private final AiOperations aiOperations;

    @Override
    public ResponseEntity<AiNutritionPlanResponse> generateNutritionPlan(AiNutritionPlanRequest request) {
        return ResponseEntity.ok(aiOperations.generateNutritionPlan(request));
    }

    @Override
    public ResponseEntity<AiEstimateMacrosResponse> estimateFoodMacros(AiEstimateMacrosRequest request) {
        return ResponseEntity.ok(aiOperations.estimateFoodMacros(request));
    }

    @Override
    public ResponseEntity<AiWorkoutPlanResponse> generateWorkoutPlan(AiWorkoutPlanRequest request) {
        return ResponseEntity.ok(aiOperations.generateWorkoutPlan(request));
    }

    @Override
    public ResponseEntity<AiMotivationalQuoteResponse> getMotivationalQuote() {
        return ResponseEntity.ok(aiOperations.generateMotivationalQuote());
    }

    @Override
    public ResponseEntity<AiWellnessPlanResponse> generateWellnessPlan(AiWellnessPlanRequest request) {
        return ResponseEntity.ok(aiOperations.generateWellnessPlan(request));
    }

    @Override
    public ResponseEntity<AiTextResponse> generateText(AiTextRequest request) {
        return ResponseEntity.ok(aiOperations.generateText(request));
    }

    @Override
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "aiAvailable", aiOperations.isAvailable()
        ));
    }
}
