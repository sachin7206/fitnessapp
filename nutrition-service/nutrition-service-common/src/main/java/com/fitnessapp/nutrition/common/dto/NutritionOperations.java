package com.fitnessapp.nutrition.common.dto;

import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import java.util.List;
import java.util.Map;

public interface NutritionOperations {
    List<NutritionPlanDTO> getAllPlans();
    List<NutritionPlanDTO> getPlansByFilters(String region, String dietType, String goal);
    NutritionPlanDTO getPlanById(Long id);
    List<NutritionPlanDTO> getRecommendedPlans(String email);
    UserNutritionPlanDTO enrollInPlan(String email, Long planId);
    UserNutritionPlanDTO getActivePlan(String email);
    List<UserNutritionPlanDTO> getUserPlanHistory(String email);
    UserNutritionPlanDTO updatePlanProgress(String email, Long userPlanId, Integer completedMeals);
    void cancelPlan(String email, Long userPlanId);
}

