package com.fitnessapp.nutrition.impl.validation;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.nutrition.common.dto.MealCompletionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Centralized validation logic for meal tracking operations.
 */
@Component
@RequiredArgsConstructor
public class MealTrackingValidator {

    private final ObjectMapper objectMapper;

    /**
     * Validate that replaced meals have required macro details.
     */
    public void validateReplacedMeal(MealCompletionRequest mealReq) {
        if (Boolean.TRUE.equals(mealReq.getReplaced())) {
            if (mealReq.getReplacedWith() == null || mealReq.getReplacedWith().trim().isEmpty()) {
                throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have a food name (replacedWith)");
            }
            if (mealReq.getProteinGrams() == null || mealReq.getProteinGrams() < 0) {
                throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have valid protein value (≥ 0)");
            }
            if (mealReq.getCarbsGrams() == null || mealReq.getCarbsGrams() < 0) {
                throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have valid carbs value (≥ 0)");
            }
            if (mealReq.getFatGrams() == null || mealReq.getFatGrams() < 0) {
                throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have valid fat value (≥ 0)");
            }
        }
    }

    /**
     * Validate foodItemsJson is a valid JSON array with safe macro values.
     */
    public void validateFoodItemsJson(String foodItemsJson, Long mealId) {
        if (foodItemsJson == null || foodItemsJson.isBlank()) return;

        try {
            List<Map<String, Object>> items = objectMapper.readValue(
                    foodItemsJson, new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> item : items) {
                double cal = toDouble(item.get("calories"));
                double p = toDouble(item.get("proteinGrams"));
                double c = toDouble(item.get("carbsGrams"));
                double f = toDouble(item.get("fatGrams"));
                if (cal < 0 || cal > 10000 || p < 0 || p > 500 || c < 0 || c > 1000 || f < 0 || f > 500) {
                    throw new IllegalArgumentException("Food item in meal (mealId=" + mealId + ") has invalid macro values");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("foodItemsJson for meal (mealId=" + mealId + ") must be a valid JSON array");
        }
    }

    /**
     * Validate all meals in a sync request.
     */
    public void validateMealCompletionRequests(List<MealCompletionRequest> meals) {
        if (meals == null) return;
        for (MealCompletionRequest mealReq : meals) {
            validateReplacedMeal(mealReq);
            validateFoodItemsJson(mealReq.getFoodItemsJson(), mealReq.getMealId());
        }
    }

    private double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        try { return Double.parseDouble(obj.toString()); } catch (NumberFormatException e) { return 0.0; }
    }
}

