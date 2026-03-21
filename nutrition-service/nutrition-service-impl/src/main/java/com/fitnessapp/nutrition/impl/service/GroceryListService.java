package com.fitnessapp.nutrition.impl.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.nutrition.common.dto.GroceryListOperations;
import com.fitnessapp.nutrition.common.dto.GroceryListResponseDTO;
import com.fitnessapp.nutrition.impl.model.*;
import com.fitnessapp.nutrition.impl.repository.UserNutritionPlanRepository;
import com.fitnessapp.user.common.dto.UserDto;
import com.fitnessapp.user.sal.UserServiceSalClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroceryListService implements GroceryListOperations {

    private final AiServiceSalClient aiSalClient;
    private final UserNutritionPlanRepository userPlanRepo;
    private final UserServiceSalClient userServiceSalClient;
    private final ObjectMapper objectMapper;

    public GroceryListResponseDTO getGroceryList(Long userId, int weekNumber) {
        UserNutritionPlan userPlan = userPlanRepo.findActiveByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No active nutrition plan found"));

        NutritionPlan plan = userPlan.getNutritionPlan();

        // Build meal data for AI
        List<Object> mealData = new ArrayList<>();
        if (plan.getMeals() != null) {
            for (Meal meal : plan.getMeals()) {
                try {
                    var map = new java.util.HashMap<String, Object>();
                    map.put("name", meal.getName());
                    map.put("mealType", meal.getMealType());
                    if (meal.getFoodItems() != null) {
                        map.put("foodItems", meal.getFoodItems().stream().map(fi -> {
                            var fiMap = new java.util.HashMap<String, Object>();
                            fiMap.put("name", fi.getName());
                            fiMap.put("quantity", fi.getQuantity());
                            return fiMap;
                        }).collect(Collectors.toList()));
                    }
                    mealData.add(map);
                } catch (Exception e) {
                    log.debug("Error building meal data: {}", e.getMessage());
                }
            }
        }

        try {
            AiGroceryListRequest aiRequest = new AiGroceryListRequest();
            aiRequest.setMeals(mealData);
            aiRequest.setDaysCount(7);
            aiRequest.setRegion(plan.getRegion());

            AiGroceryListResponse aiResponse = aiSalClient.generateGroceryList(aiRequest);

            GroceryListResponseDTO response = new GroceryListResponseDTO();
            response.setPlanName(plan.getName());
            response.setWeekNumber(weekNumber);
            response.setCategories(aiResponse.getCategories() != null
                    ? new ArrayList<>(aiResponse.getCategories()) : new ArrayList<>());
            response.setFromAi(aiResponse.isFromAi());
            return response;
        } catch (Exception e) {
            log.warn("AI grocery list failed, returning fallback: {}", e.getMessage());
            GroceryListResponseDTO fallback = new GroceryListResponseDTO();
            fallback.setPlanName(plan.getName());
            fallback.setWeekNumber(weekNumber);
            fallback.setCategories(new ArrayList<>());
            fallback.setFromAi(false);
            return fallback;
        }
    }
}
