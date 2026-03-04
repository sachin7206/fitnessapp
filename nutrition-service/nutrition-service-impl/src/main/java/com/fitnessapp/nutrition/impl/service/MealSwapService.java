package com.fitnessapp.nutrition.impl.service;

import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.nutrition.impl.model.NutritionPlan;
import com.fitnessapp.nutrition.impl.model.UserNutritionPlan;
import com.fitnessapp.nutrition.impl.repository.UserNutritionPlanRepository;
import com.fitnessapp.user.common.dto.UserDto;
import com.fitnessapp.user.sal.UserServiceSalClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealSwapService implements MealSwapOperations {

    private final AiServiceSalClient aiSalClient;
    private final UserNutritionPlanRepository userPlanRepo;
    private final UserServiceSalClient userServiceSalClient;

    public MealSwapResponseDTO suggestMealSwap(String email, MealSwapRequestDTO request) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        UserNutritionPlan userPlan = userPlanRepo.findActiveByUserId(user.getId()).orElse(null);

        String dietType = "BALANCED";
        String region = "NORTH";
        if (userPlan != null && userPlan.getNutritionPlan() != null) {
            NutritionPlan plan = userPlan.getNutritionPlan();
            if (plan.getDietType() != null) dietType = plan.getDietType();
            if (plan.getRegion() != null) region = plan.getRegion();
        }

        try {
            AiMealSwapRequest aiRequest = new AiMealSwapRequest();
            aiRequest.setOriginalMealName(request.getMealName());
            aiRequest.setOriginalCalories(request.getCalories());
            aiRequest.setOriginalProtein(request.getProteinGrams());
            aiRequest.setOriginalCarbs(request.getCarbsGrams());
            aiRequest.setOriginalFat(request.getFatGrams());
            aiRequest.setMealType(request.getMealType());
            aiRequest.setDietType(dietType);
            aiRequest.setRegion(region);
            aiRequest.setTolerancePercent(5);

            AiMealSwapResponse aiResponse = aiSalClient.suggestMealSwap(aiRequest);

            MealSwapResponseDTO response = new MealSwapResponseDTO();
            response.setOriginalMeal(request.getMealName());
            response.setAlternatives(aiResponse.getAlternatives() != null
                    ? new ArrayList<>(aiResponse.getAlternatives()) : new ArrayList<>());
            return response;
        } catch (Exception e) {
            log.warn("AI meal swap failed, returning fallback: {}", e.getMessage());
            MealSwapResponseDTO fallback = new MealSwapResponseDTO();
            fallback.setOriginalMeal(request.getMealName());
            fallback.setAlternatives(new ArrayList<>());
            return fallback;
        }
    }
}
