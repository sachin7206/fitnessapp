package com.fitnessapp.nutrition.common.dto;

import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import java.util.List;
import java.util.Map;

public interface NutritionOperations {
    List<NutritionPlanDTO> getAllPlans();
    List<NutritionPlanDTO> getPlansByFilters(String region, String dietType, String goal);
    NutritionPlanDTO getPlanById(Long id);
    List<NutritionPlanDTO> getRecommendedPlans(Long userId);
    UserNutritionPlanDTO enrollInPlan(Long userId, Long planId);
    UserNutritionPlanDTO getActivePlan(Long userId);
    List<UserNutritionPlanDTO> getUserPlanHistory(Long userId);
    UserNutritionPlanDTO updatePlanProgress(Long userId, Long userPlanId, Integer completedMeals);
    void cancelPlan(Long userId, Long userPlanId);
    UserNutritionPlanDTO saveFreePlan(Long userId, FreePlanRequestDTO request);
}
