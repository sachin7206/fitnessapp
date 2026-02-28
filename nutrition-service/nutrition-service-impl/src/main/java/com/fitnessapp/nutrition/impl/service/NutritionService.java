package com.fitnessapp.nutrition.impl.service;

import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.user.common.dto.UserDto;
import com.fitnessapp.user.sal.UserServiceSalClient;
import com.fitnessapp.nutrition.impl.model.*;
import com.fitnessapp.nutrition.impl.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NutritionService implements NutritionOperations {
    private final NutritionPlanRepository nutritionPlanRepository;
    private final UserNutritionPlanRepository userNutritionPlanRepository;
    private final UserServiceSalClient userServiceSalClient;

    @Transactional(readOnly = true)
    public List<NutritionPlanDTO> getAllPlans() {
        return nutritionPlanRepository.findByIsActiveTrue().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NutritionPlanDTO> getPlansByFilters(String region, String dietType, String goal) {
        return nutritionPlanRepository.findByFilters(region, dietType, goal).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NutritionPlanDTO getPlanById(Long id) {
        return convertToDTOWithMeals(nutritionPlanRepository.findByIdWithMealsAndFoodItems(id)
            .orElseThrow(() -> new RuntimeException("Nutrition plan not found")));
    }

    @Transactional(readOnly = true)
    public List<NutritionPlanDTO> getRecommendedPlans(String email) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        String region = user.getProfile() != null ? user.getProfile().getRegion() : null;
        List<String> dietaryPrefs = user.getHealthMetrics() != null && user.getHealthMetrics().getDietaryPreferences() != null
            ? user.getHealthMetrics().getDietaryPreferences() : List.of();
        String dietType = null;
        if (dietaryPrefs.contains("VEGETARIAN")) dietType = "VEGETARIAN";
        else if (dietaryPrefs.contains("VEGAN")) dietType = "VEGAN";
        String goal = user.getGoals() != null && !user.getGoals().isEmpty() ? user.getGoals().get(0) : null;
        return nutritionPlanRepository.findByFilters(region, dietType, goal).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    public UserNutritionPlanDTO enrollInPlan(String email, Long planId) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        NutritionPlan plan = nutritionPlanRepository.findById(planId).orElseThrow(() -> new RuntimeException("Nutrition plan not found"));
        userNutritionPlanRepository.deactivateAllActiveForUser(user.getId());
        UserNutritionPlan userPlan = new UserNutritionPlan();
        userPlan.setUserId(user.getId());
        userPlan.setNutritionPlan(plan);
        userPlan.setStartDate(LocalDate.now());
        userPlan.setEndDate(LocalDate.now().plusDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30));
        userPlan.setStatus("ACTIVE"); userPlan.setCurrentDay(1);
        userPlan.setTotalMeals(plan.getMeals() != null ? plan.getMeals().size() * (plan.getDurationDays() != null ? plan.getDurationDays() : 30) : 0);
        return convertUserPlanToDTO(userNutritionPlanRepository.save(userPlan));
    }

    @Transactional(readOnly = true)
    public UserNutritionPlanDTO getActivePlan(String email) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        return userNutritionPlanRepository.findActiveByUserId(user.getId()).map(up -> {
            nutritionPlanRepository.findByIdWithMealsAndFoodItems(up.getNutritionPlan().getId()).ifPresent(up::setNutritionPlan);
            return convertUserPlanToDTO(up);
        }).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<UserNutritionPlanDTO> getUserPlanHistory(String email) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        return userNutritionPlanRepository.findByUserId(user.getId()).stream().map(this::convertUserPlanToDTO).collect(Collectors.toList());
    }

    @Transactional
    public UserNutritionPlanDTO updatePlanProgress(String email, Long userPlanId, Integer completedMeals) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        UserNutritionPlan up = userNutritionPlanRepository.findByIdWithPlan(userPlanId).orElseThrow(() -> new RuntimeException("Plan not found"));
        if (!up.getUserId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        up.setCompletedMeals(completedMeals);
        if (up.getTotalMeals() > 0) up.setAdherencePercentage((double) completedMeals / up.getTotalMeals() * 100);
        up.setCurrentDay((int) java.time.temporal.ChronoUnit.DAYS.between(up.getStartDate(), LocalDate.now()) + 1);
        return convertUserPlanToDTO(userNutritionPlanRepository.save(up));
    }

    @Transactional
    public void cancelPlan(String email, Long userPlanId) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        UserNutritionPlan up = userNutritionPlanRepository.findById(userPlanId).orElseThrow(() -> new RuntimeException("Plan not found"));
        if (!up.getUserId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        up.setStatus("CANCELLED");
        userNutritionPlanRepository.save(up);
    }

    // ========== Conversion Methods ==========
    public NutritionPlanDTO convertToDTO(NutritionPlan p) {
        NutritionPlanDTO d = new NutritionPlanDTO();
        d.setId(p.getId()); d.setName(p.getName()); d.setDescription(p.getDescription());
        d.setRegion(p.getRegion()); d.setDietType(p.getDietType()); d.setGoal(p.getGoal());
        d.setTotalCalories(p.getTotalCalories()); d.setProteinGrams(p.getProteinGrams());
        d.setCarbsGrams(p.getCarbsGrams()); d.setFatGrams(p.getFatGrams()); d.setFiberGrams(p.getFiberGrams());
        d.setDifficulty(p.getDifficulty()); d.setDurationDays(p.getDurationDays()); d.setIsActive(p.getIsActive());
        return d;
    }

    public NutritionPlanDTO convertToDTOWithMeals(NutritionPlan p) {
        NutritionPlanDTO d = convertToDTO(p);
        if (p.getMeals() != null)
            d.setMeals(p.getMeals().stream().map(this::convertMealToDTO).collect(Collectors.toList()));
        return d;
    }

    public MealDTO convertMealToDTO(Meal m) {
        MealDTO d = new MealDTO();
        d.setId(m.getId()); d.setName(m.getName()); d.setMealType(m.getMealType());
        d.setTimeOfDay(m.getTimeOfDay()); d.setDayNumber(m.getDayNumber());
        d.setCalories(m.getCalories()); d.setProteinGrams(m.getProteinGrams());
        d.setCarbsGrams(m.getCarbsGrams()); d.setFatGrams(m.getFatGrams());
        d.setPreparationTips(m.getPreparationTips()); d.setIndianAlternatives(m.getIndianAlternatives());
        if (m.getFoodItems() != null)
            d.setFoodItems(m.getFoodItems().stream().map(this::convertFoodItemToDTO).collect(Collectors.toList()));
        return d;
    }

    public FoodItemDTO convertFoodItemToDTO(FoodItem i) {
        FoodItemDTO d = new FoodItemDTO();
        d.setId(i.getId()); d.setName(i.getName()); d.setHindiName(i.getHindiName());
        d.setRegionalName(i.getRegionalName()); d.setDescription(i.getDescription());
        d.setQuantity(i.getQuantity()); d.setCalories(i.getCalories());
        d.setProteinGrams(i.getProteinGrams()); d.setCarbsGrams(i.getCarbsGrams());
        d.setFatGrams(i.getFatGrams()); d.setFiberGrams(i.getFiberGrams());
        d.setIngredients(i.getIngredients()); d.setRecipe(i.getRecipe());
        d.setImageUrl(i.getImageUrl()); d.setIsVegetarian(i.getIsVegetarian());
        d.setIsVegan(i.getIsVegan()); d.setIsGlutenFree(i.getIsGlutenFree());
        d.setIsDairyFree(i.getIsDairyFree()); d.setIsJainFriendly(i.getIsJainFriendly());
        d.setRegion(i.getRegion());
        return d;
    }

    private UserNutritionPlanDTO convertUserPlanToDTO(UserNutritionPlan up) {
        UserNutritionPlanDTO d = new UserNutritionPlanDTO();
        d.setId(up.getId()); d.setUserId(up.getUserId());
        d.setNutritionPlan(convertToDTOWithMeals(up.getNutritionPlan()));
        d.setStartDate(up.getStartDate()); d.setEndDate(up.getEndDate());
        d.setCurrentDay(up.getCurrentDay()); d.setStatus(up.getStatus());
        d.setCompletedMeals(up.getCompletedMeals()); d.setTotalMeals(up.getTotalMeals());
        d.setAdherencePercentage(up.getAdherencePercentage()); d.setNotes(up.getNotes());
        d.setEnrolledAt(up.getEnrolledAt());
        return d;
    }
}

