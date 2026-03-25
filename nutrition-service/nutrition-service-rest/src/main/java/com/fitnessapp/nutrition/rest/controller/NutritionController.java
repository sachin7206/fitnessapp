package com.fitnessapp.nutrition.rest.controller;

import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.nutrition.rest.api.NutritionApi;
import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
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
    private final HttpServletRequest httpServletRequest;

    private Long getCurrentUserId() {
        Object userId = httpServletRequest.getAttribute("userId");
        if (userId == null) {
            throw new IllegalStateException("Authentication required: userId not found in request");
        }
        if (userId instanceof Long) return (Long) userId;
        if (userId instanceof Number) return ((Number) userId).longValue();
        try { return Long.parseLong(userId.toString()); }
        catch (NumberFormatException e) {
            throw new IllegalStateException("Invalid userId format in authentication token");
        }
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
        return ResponseEntity.ok(nutritionService.getRecommendedPlans(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<UserNutritionPlanDTO> enrollInPlan(Long planId) {
        return ResponseEntity.ok(nutritionService.enrollInPlan(getCurrentUserId(), planId));
    }

    @Override
    public ResponseEntity<NutritionPlanDTO> generatePersonalizedPlan(GenerateNutritionPlanRequest request) {
        return ResponseEntity.ok(aiBasedNutritionService.generatePersonalizedPlan(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<UserNutritionPlanDTO> getActivePlan() {
        UserNutritionPlanDTO plan = nutritionService.getActivePlan(getCurrentUserId());
        return plan == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(plan);
    }

    @Override
    public ResponseEntity<List<UserNutritionPlanDTO>> getPlanHistory() {
        return ResponseEntity.ok(nutritionService.getUserPlanHistory(getCurrentUserId()));
    }

    @Override
    @SuppressWarnings("unchecked")
    public ResponseEntity<UserNutritionPlanDTO> updateProgress(Long userPlanId, Object body) {
        if (body == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        Map<String, Object> map = (Map<String, Object>) body;
        Object completedObj = map.get("completedMeals");
        if (completedObj == null) {
            throw new IllegalArgumentException("completedMeals is required");
        }
        int completedMeals;
        if (completedObj instanceof Number) {
            completedMeals = ((Number) completedObj).intValue();
        } else {
            try { completedMeals = Integer.parseInt(completedObj.toString()); }
            catch (NumberFormatException e) { throw new IllegalArgumentException("completedMeals must be a number"); }
        }
        if (completedMeals < 0 || completedMeals > 10000) {
            throw new IllegalArgumentException("completedMeals must be between 0 and 10000");
        }
        return ResponseEntity.ok(nutritionService.updatePlanProgress(getCurrentUserId(), userPlanId, completedMeals));
    }

    @Override
    public ResponseEntity<Void> cancelPlan(Long userPlanId) {
        nutritionService.cancelPlan(getCurrentUserId(), userPlanId);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<UserFoodPreferenceDTO> getFoodPreferences() {
        UserFoodPreferenceDTO prefs = userFoodPreferenceService.getFoodPreferences(getCurrentUserId());
        return prefs == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(prefs);
    }

    @Override
    public ResponseEntity<UserFoodPreferenceDTO> saveFoodPreferences(UserFoodPreferenceDTO request) {
        return ResponseEntity.ok(userFoodPreferenceService.saveFoodPreferences(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<ProfileCompletionStatusDTO> checkProfileStatus() {
        return ResponseEntity.ok(nutritionProfileService.getProfileCompletion(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<Object> estimateFoodMacros(Object body) {
        Map<String, String> map = (Map<String, String>) body;
        String foodDescription = map.get("foodDescription");
        if (foodDescription == null || foodDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        foodDescription = foodDescription.trim();
        if (foodDescription.length() > 500) {
            throw new IllegalArgumentException("Food description must be ≤ 500 characters");
        }
        return ResponseEntity.ok(aiBasedNutritionService.estimateFoodMacros(foodDescription));
    }

    @Override
    public ResponseEntity<DailyNutritionSummaryDTO> syncDailyTracking(DailyTrackingSyncRequest request) {
        return ResponseEntity.ok(mealTrackingService.syncDailyTracking(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<DailyNutritionSummaryDTO> getTodayTracking() {
        return ResponseEntity.ok(mealTrackingService.getTodayTracking(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<FoodLogDTO> logFoodPhoto(FoodPhotoLogRequest request) {
        return ResponseEntity.ok(foodLoggingService.logFoodPhoto(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<List<FoodLogDTO>> getTodayFoodLogs() {
        return ResponseEntity.ok(foodLoggingService.getTodayFoodLogs(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<List<FoodLogDTO>> getFoodLogHistory(Integer days) {
        int d = days != null ? days : 7;
        if (d < 1 || d > 365) {
            throw new IllegalArgumentException("Days must be between 1 and 365");
        }
        return ResponseEntity.ok(foodLoggingService.getFoodLogHistory(getCurrentUserId(), d));
    }

    @Override
    public ResponseEntity<MealSwapResponseDTO> suggestMealSwap(MealSwapRequestDTO request) {
        return ResponseEntity.ok(mealSwapService.suggestMealSwap(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<NutritionPlanDTO> applyMealSwap(ApplyMealSwapRequest request) {
        Long userId = getCurrentUserId();
        UserNutritionPlanDTO userPlan = nutritionService.getActivePlan(userId);
        return userPlan != null ? ResponseEntity.ok(userPlan.getNutritionPlan()) : ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<GroceryListResponseDTO> getGroceryList(Integer weekNumber) {
        int week = weekNumber != null ? weekNumber : 1;
        if (week < 1 || week > 52) {
            throw new IllegalArgumentException("Week number must be between 1 and 52");
        }
        return ResponseEntity.ok(groceryListService.getGroceryList(getCurrentUserId(), week));
    }

    @Override
    public ResponseEntity<UserNutritionPlanDTO> saveFreePlan(FreePlanRequestDTO request) {
        return ResponseEntity.ok(nutritionService.saveFreePlan(getCurrentUserId(), request));
    }

    @GetMapping("/nutrition/report")
    public ResponseEntity<DietReportDTO> getDietReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        // Validate format
        if (startDate == null || endDate == null
                || !startDate.matches("^\\d{4}-\\d{2}-\\d{2}$")
                || !endDate.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            throw new IllegalArgumentException("Date parameters must be in YYYY-MM-DD format");
        }
        LocalDate start;
        LocalDate end;
        try {
            start = LocalDate.parse(startDate);
            end = LocalDate.parse(endDate);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date value. Use valid YYYY-MM-DD dates.");
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("startDate must be before or equal to endDate");
        }
        if (end.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("endDate cannot be in the future");
        }
        if (start.isBefore(end.minusYears(1))) {
            throw new IllegalArgumentException("Date range cannot exceed 1 year");
        }
        return ResponseEntity.ok(mealTrackingService.getDietReport(getCurrentUserId(), start, end));
    }
}
