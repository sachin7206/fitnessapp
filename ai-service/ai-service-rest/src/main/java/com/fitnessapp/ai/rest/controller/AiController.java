package com.fitnessapp.ai.rest.controller;

import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.rest.api.AiNutritionApi;
import com.fitnessapp.ai.rest.api.AiWorkoutApi;
import com.fitnessapp.ai.rest.api.AiWellnessApi;
import com.fitnessapp.ai.rest.api.AiTextApi;
import com.fitnessapp.ai.rest.api.AiProgressApi;
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
public class AiController implements AiNutritionApi, AiWorkoutApi, AiWellnessApi, AiTextApi, AiProgressApi, HealthApi {

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
    public ResponseEntity<AiFoodPhotoAnalysisResponse> analyzeFoodPhoto(AiFoodPhotoAnalysisRequest request) {
        return ResponseEntity.ok(aiOperations.analyzeFoodPhoto(request));
    }

    @Override
    public ResponseEntity<AiMealSwapResponse> suggestMealSwap(AiMealSwapRequest request) {
        return ResponseEntity.ok(aiOperations.suggestMealSwap(request));
    }

    @Override
    public ResponseEntity<AiGroceryListResponse> generateGroceryList(AiGroceryListRequest request) {
        return ResponseEntity.ok(aiOperations.generateGroceryList(request));
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
    public ResponseEntity<AiExerciseSubstitutionResponse> suggestExerciseSubstitutes(AiExerciseSubstitutionRequest request) {
        return ResponseEntity.ok(aiOperations.suggestExerciseSubstitutes(request));
    }

    @Override
    public ResponseEntity<AiWorkoutAdjustResponse> adjustWorkoutProgression(AiWorkoutAdjustRequest request) {
        return ResponseEntity.ok(aiOperations.adjustWorkoutProgression(request));
    }

    @Override
    public ResponseEntity<AiWellnessPlanResponse> generateWellnessPlan(AiWellnessPlanRequest request) {
        return ResponseEntity.ok(aiOperations.generateWellnessPlan(request));
    }

    @Override
    public ResponseEntity<AiRestDayResponse> analyzeRestDay(AiRestDayRequest request) {
        return ResponseEntity.ok(aiOperations.analyzeRestDay(request));
    }

    @Override
    public ResponseEntity<AiWeeklyReportResponse> generateWeeklyReport(AiWeeklyReportRequest request) {
        return ResponseEntity.ok(aiOperations.generateWeeklyReport(request));
    }

    @Override
    public ResponseEntity<AiPlateauDetectionResponse> detectPlateau(AiPlateauDetectionRequest request) {
        return ResponseEntity.ok(aiOperations.detectPlateau(request));
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
