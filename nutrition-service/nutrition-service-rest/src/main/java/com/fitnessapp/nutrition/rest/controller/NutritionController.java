package com.fitnessapp.nutrition.rest.controller;

import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.nutrition.rest.api.NutritionApi;
import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class NutritionController implements NutritionApi {

    private final NutritionOperations nutritionService;
    private final AIBasedNutritionOperations aiBasedNutritionService;
    private final FoodPreferenceOperations userFoodPreferenceService;
    private final NutritionProfileOperations nutritionProfileService;
    private final MealTrackingOperations mealTrackingService;
    private final FoodLoggingOperations foodLoggingService;
    private final MealSwapOperations mealSwapService;
    private final GroceryListOperations groceryListService;

    private String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @Override
    public ResponseEntity<List<NutritionPlanDTO>> getAllPlans(String region, String dietType, String goal) {
        if (region != null || dietType != null || goal != null)
            return ResponseEntity.ok(nutritionService.getPlansByFilters(region, dietType, goal));
        return ResponseEntity.ok(nutritionService.getAllPlans());
    }

    @Override
    public ResponseEntity<NutritionPlanDTO> getPlanById(Long id) {
        return ResponseEntity.ok(nutritionService.getPlanById(id));
    }

    @Override
    public ResponseEntity<List<NutritionPlanDTO>> getRecommendedPlans() {
        return ResponseEntity.ok(nutritionService.getRecommendedPlans(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<UserNutritionPlanDTO> enrollInPlan(Long planId) {
        return ResponseEntity.ok(nutritionService.enrollInPlan(getCurrentEmail(), planId));
    }

    @Override
    public ResponseEntity<NutritionPlanDTO> generatePersonalizedPlan(GenerateNutritionPlanRequest request) {
        return ResponseEntity.ok(aiBasedNutritionService.generatePersonalizedPlan(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<UserNutritionPlanDTO> getActivePlan() {
        UserNutritionPlanDTO plan = nutritionService.getActivePlan(getCurrentEmail());
        return plan == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(plan);
    }

    @Override
    public ResponseEntity<List<UserNutritionPlanDTO>> getPlanHistory() {
        return ResponseEntity.ok(nutritionService.getUserPlanHistory(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<UserNutritionPlanDTO> updateProgress(Long userPlanId, Object body) {
        Map<String, Integer> map = (Map<String, Integer>) body;
        return ResponseEntity.ok(nutritionService.updatePlanProgress(getCurrentEmail(), userPlanId, map.get("completedMeals")));
    }

    @Override
    public ResponseEntity<Void> cancelPlan(Long userPlanId) {
        nutritionService.cancelPlan(getCurrentEmail(), userPlanId);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<UserFoodPreferenceDTO> getFoodPreferences() {
        UserFoodPreferenceDTO prefs = userFoodPreferenceService.getFoodPreferences(getCurrentEmail());
        return prefs == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(prefs);
    }

    @Override
    public ResponseEntity<UserFoodPreferenceDTO> saveFoodPreferences(UserFoodPreferenceDTO request) {
        return ResponseEntity.ok(userFoodPreferenceService.saveFoodPreferences(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<ProfileCompletionStatusDTO> checkProfileStatus() {
        return ResponseEntity.ok(nutritionProfileService.getProfileCompletion(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<Object> estimateFoodMacros(Object body) {
        Map<String, String> map = (Map<String, String>) body;
        String foodDescription = map.get("foodDescription");
        if (foodDescription == null || foodDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(aiBasedNutritionService.estimateFoodMacros(foodDescription.trim()));
    }

    @Override
    public ResponseEntity<DailyNutritionSummaryDTO> syncDailyTracking(DailyTrackingSyncRequest request) {
        return ResponseEntity.ok(mealTrackingService.syncDailyTracking(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<DailyNutritionSummaryDTO> getTodayTracking() {
        return ResponseEntity.ok(mealTrackingService.getTodayTracking(getCurrentEmail()));
    }

    // ========== NEW FEATURE ENDPOINTS ==========

    @Override
    public ResponseEntity<FoodLogDTO> logFoodPhoto(FoodPhotoLogRequest request) {
        return ResponseEntity.ok(foodLoggingService.logFoodPhoto(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<List<FoodLogDTO>> getTodayFoodLogs() {
        return ResponseEntity.ok(foodLoggingService.getTodayFoodLogs(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<List<FoodLogDTO>> getFoodLogHistory(Integer days) {
        return ResponseEntity.ok(foodLoggingService.getFoodLogHistory(getCurrentEmail(), days != null ? days : 7));
    }

    @Override
    public ResponseEntity<MealSwapResponseDTO> suggestMealSwap(MealSwapRequestDTO request) {
        return ResponseEntity.ok(mealSwapService.suggestMealSwap(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<NutritionPlanDTO> applyMealSwap(ApplyMealSwapRequest request) {
        // For now, just return the current active plan — actual swap logic can be enhanced
        String email = getCurrentEmail();
        UserNutritionPlanDTO userPlan = nutritionService.getActivePlan(email);
        return userPlan != null ? ResponseEntity.ok(userPlan.getNutritionPlan()) : ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<GroceryListResponseDTO> getGroceryList(Integer weekNumber) {
        return ResponseEntity.ok(groceryListService.getGroceryList(getCurrentEmail(), weekNumber != null ? weekNumber : 1));
    }
}
