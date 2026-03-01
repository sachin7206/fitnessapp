package com.fitnessapp.nutrition.rest.controller;

import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionOperations nutritionService;
    private final AIBasedNutritionOperations aiBasedNutritionService;
    private final FoodPreferenceOperations userFoodPreferenceService;
    private final NutritionProfileOperations nutritionProfileService;
    private final MealTrackingOperations mealTrackingService;

    private String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @GetMapping("/plans")
    public ResponseEntity<List<NutritionPlanDTO>> getAllPlans(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String dietType,
            @RequestParam(required = false) String goal) {
        if (region != null || dietType != null || goal != null)
            return ResponseEntity.ok(nutritionService.getPlansByFilters(region, dietType, goal));
        return ResponseEntity.ok(nutritionService.getAllPlans());
    }

    @GetMapping("/plans/{id}")
    public ResponseEntity<NutritionPlanDTO> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(nutritionService.getPlanById(id));
    }

    @GetMapping("/plans/recommended")
    public ResponseEntity<List<NutritionPlanDTO>> getRecommendedPlans() {
        return ResponseEntity.ok(nutritionService.getRecommendedPlans(getCurrentEmail()));
    }

    @PostMapping("/plans/{planId}/enroll")
    public ResponseEntity<UserNutritionPlanDTO> enrollInPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(nutritionService.enrollInPlan(getCurrentEmail(), planId));
    }

    @PostMapping("/generate-plan")
    public ResponseEntity<NutritionPlanDTO> generatePersonalizedPlan(@RequestBody GenerateNutritionPlanRequest request) {
        return ResponseEntity.ok(aiBasedNutritionService.generatePersonalizedPlan(getCurrentEmail(), request));
    }

    @GetMapping("/my-plan")
    public ResponseEntity<UserNutritionPlanDTO> getActivePlan() {
        UserNutritionPlanDTO plan = nutritionService.getActivePlan(getCurrentEmail());
        return plan == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(plan);
    }

    @GetMapping("/my-plans/history")
    public ResponseEntity<List<UserNutritionPlanDTO>> getPlanHistory() {
        return ResponseEntity.ok(nutritionService.getUserPlanHistory(getCurrentEmail()));
    }

    @PutMapping("/my-plans/{userPlanId}/progress")
    public ResponseEntity<UserNutritionPlanDTO> updateProgress(@PathVariable Long userPlanId, @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(nutritionService.updatePlanProgress(getCurrentEmail(), userPlanId, body.get("completedMeals")));
    }

    @DeleteMapping("/my-plans/{userPlanId}")
    public ResponseEntity<Void> cancelPlan(@PathVariable Long userPlanId) {
        nutritionService.cancelPlan(getCurrentEmail(), userPlanId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/food-preferences")
    public ResponseEntity<UserFoodPreferenceDTO> getFoodPreferences() {
        UserFoodPreferenceDTO prefs = userFoodPreferenceService.getFoodPreferences(getCurrentEmail());
        return prefs == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(prefs);
    }

    @PostMapping("/food-preferences")
    public ResponseEntity<UserFoodPreferenceDTO> saveFoodPreferences(@RequestBody UserFoodPreferenceDTO request) {
        return ResponseEntity.ok(userFoodPreferenceService.saveFoodPreferences(getCurrentEmail(), request));
    }

    @GetMapping("/profile-status")
    public ResponseEntity<ProfileCompletionStatusDTO> checkProfileStatus() {
        return ResponseEntity.ok(nutritionProfileService.getProfileCompletion(getCurrentEmail()));
    }

    @PostMapping("/estimate-macros")
    public ResponseEntity<Map<String, Object>> estimateFoodMacros(@RequestBody Map<String, String> body) {
        String foodDescription = body.get("foodDescription");
        if (foodDescription == null || foodDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(aiBasedNutritionService.estimateFoodMacros(foodDescription.trim()));
    }

    // -------- Daily Meal Tracking --------

    @PutMapping("/tracking/today")
    public ResponseEntity<DailyNutritionSummaryDTO> syncDailyTracking(@RequestBody DailyTrackingSyncRequest request) {
        return ResponseEntity.ok(mealTrackingService.syncDailyTracking(getCurrentEmail(), request));
    }

    @GetMapping("/tracking/today")
    public ResponseEntity<DailyNutritionSummaryDTO> getTodayTracking() {
        return ResponseEntity.ok(mealTrackingService.getTodayTracking(getCurrentEmail()));
    }
}
