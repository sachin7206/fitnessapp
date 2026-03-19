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
        int durationDays = plan.getDurationDays() != null ? plan.getDurationDays() : 30;

        boolean hasActivePlan = userNutritionPlanRepository.findActiveByUserId(user.getId()).isPresent();
        LocalDate startDate;

        if (hasActivePlan) {
            // Mark current plan as ending today instead of cancelling
            userNutritionPlanRepository.markActiveAsEndingToday(user.getId());
            // Cancel any previously scheduled plan
            userNutritionPlanRepository.cancelScheduledForUser(user.getId());
            // New plan starts tomorrow
            startDate = LocalDate.now().plusDays(1);
        } else {
            // Cancel any previously scheduled plan
            userNutritionPlanRepository.cancelScheduledForUser(user.getId());
            // Check if there's an ENDING_TODAY plan (created earlier today)
            boolean hasEndingToday = userNutritionPlanRepository.findEndingTodayByUserId(user.getId()).isPresent();
            startDate = hasEndingToday ? LocalDate.now().plusDays(1) : LocalDate.now();
        }

        UserNutritionPlan userPlan = new UserNutritionPlan();
        userPlan.setUserId(user.getId());
        userPlan.setNutritionPlan(plan);
        userPlan.setStartDate(startDate);
        userPlan.setEndDate(startDate.plusDays(durationDays));
        userPlan.setStatus(startDate.isAfter(LocalDate.now()) ? "SCHEDULED" : "ACTIVE");
        userPlan.setCurrentDay(1);
        userPlan.setTotalMeals(plan.getMeals() != null ? plan.getMeals().size() * durationDays : 0);

        UserNutritionPlanDTO dto = convertUserPlanToDTO(userNutritionPlanRepository.save(userPlan));
        dto.setScheduledForTomorrow(startDate.isAfter(LocalDate.now()));
        return dto;
    }

    @Transactional
    public UserNutritionPlanDTO getActivePlan(String email) {
        UserDto user = userServiceSalClient.getUserByEmail(email);
        LocalDate today = LocalDate.now();

        // 1. Complete ENDING_TODAY plans whose endDate has passed
        userNutritionPlanRepository.findEndingTodayByUserId(user.getId()).ifPresent(ending -> {
            if (ending.getEndDate() != null && ending.getEndDate().isBefore(today)) {
                ending.setStatus("COMPLETED");
                userNutritionPlanRepository.save(ending);
            }
        });

        // 2. Activate SCHEDULED plans whose startDate is today or earlier
        userNutritionPlanRepository.findScheduledByUserId(user.getId()).ifPresent(scheduled -> {
            if (!scheduled.getStartDate().isAfter(today)) {
                scheduled.setStatus("ACTIVE");
                userNutritionPlanRepository.save(scheduled);
            }
        });

        // 3. If ENDING_TODAY plan exists (still valid for today), return it
        var endingToday = userNutritionPlanRepository.findEndingTodayByUserId(user.getId());
        if (endingToday.isPresent()) {
            UserNutritionPlan up = endingToday.get();
            nutritionPlanRepository.findByIdWithMealsAndFoodItems(up.getNutritionPlan().getId()).ifPresent(up::setNutritionPlan);
            return convertUserPlanToDTO(up);
        }

        // 4. Return ACTIVE plan
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

    @Transactional
    @SuppressWarnings("unchecked")
    public UserNutritionPlanDTO saveFreePlan(String email, FreePlanRequestDTO request) {
        UserDto user = userServiceSalClient.getUserByEmail(email);

        // Cancel any existing active plan
        userNutritionPlanRepository.findActiveByUserId(user.getId()).ifPresent(existing -> {
            existing.setStatus("CANCELLED");
            userNutritionPlanRepository.save(existing);
        });
        // Cancel any scheduled plan
        userNutritionPlanRepository.cancelScheduledForUser(user.getId());
        // Cancel any ENDING_TODAY plan
        userNutritionPlanRepository.findEndingTodayByUserId(user.getId()).ifPresent(ending -> {
            ending.setStatus("CANCELLED");
            userNutritionPlanRepository.save(ending);
        });

        // Build NutritionPlan entity from free plan request
        NutritionPlan plan = new NutritionPlan();
        plan.setName(request.getPlanName() != null ? request.getPlanName() : "My Custom Diet Plan");
        plan.setDescription("Custom free plan created by user");
        plan.setRegion("CUSTOM");
        plan.setDietType("CUSTOM");
        plan.setGoal("CUSTOM");
        plan.setTotalCalories(request.getTotalCalories() != null ? request.getTotalCalories() : 0);
        plan.setProteinGrams(request.getProteinGrams() != null ? request.getProteinGrams() : 0.0);
        plan.setCarbsGrams(request.getCarbsGrams() != null ? request.getCarbsGrams() : 0.0);
        plan.setFatGrams(request.getFatGrams() != null ? request.getFatGrams() : 0.0);
        plan.setFiberGrams(0.0);
        plan.setDifficulty("CUSTOM");
        plan.setDurationDays(30);
        plan.setIsActive(true);

        // Build meals from Map-based structure
        java.util.Set<Meal> mealEntities = new java.util.LinkedHashSet<>();
        if (request.getMeals() != null) {
            for (java.util.Map<String, Object> mealMap : request.getMeals()) {
                Meal meal = new Meal();
                meal.setName(getStringVal(mealMap, "name"));
                meal.setMealType(getStringVal(mealMap, "mealType"));
                meal.setTimeOfDay(getStringVal(mealMap, "timeOfDay"));
                meal.setDayNumber(1);

                // Build food items
                java.util.Set<FoodItem> foodItemEntities = new java.util.LinkedHashSet<>();
                int mealCalories = 0;
                double mealProtein = 0, mealCarbs = 0, mealFat = 0;

                Object foodItemsObj = mealMap.get("foodItems");
                if (foodItemsObj instanceof java.util.List) {
                    for (Object itemObj : (java.util.List<?>) foodItemsObj) {
                        if (itemObj instanceof java.util.Map) {
                            java.util.Map<String, Object> itemMap = (java.util.Map<String, Object>) itemObj;
                            FoodItem foodItem = new FoodItem();
                            foodItem.setName(getStringVal(itemMap, "name"));
                            foodItem.setQuantity(getStringVal(itemMap, "quantity") != null ? getStringVal(itemMap, "quantity") : "1 serving");
                            foodItem.setCalories(getIntVal(itemMap, "calories"));
                            foodItem.setProteinGrams(getDoubleVal(itemMap, "proteinGrams"));
                            foodItem.setCarbsGrams(getDoubleVal(itemMap, "carbsGrams"));
                            foodItem.setFatGrams(getDoubleVal(itemMap, "fatGrams"));
                            foodItem.setIsVegetarian(true);
                            foodItem.setRegion("CUSTOM");

                            mealCalories += foodItem.getCalories() != null ? foodItem.getCalories() : 0;
                            mealProtein += foodItem.getProteinGrams() != null ? foodItem.getProteinGrams() : 0.0;
                            mealCarbs += foodItem.getCarbsGrams() != null ? foodItem.getCarbsGrams() : 0.0;
                            mealFat += foodItem.getFatGrams() != null ? foodItem.getFatGrams() : 0.0;

                            foodItemEntities.add(foodItem);
                        }
                    }
                }

                meal.setFoodItems(foodItemEntities);
                meal.setCalories(mealCalories);
                meal.setProteinGrams(mealProtein);
                meal.setCarbsGrams(mealCarbs);
                meal.setFatGrams(mealFat);

                mealEntities.add(meal);
            }
        }
        plan.setMeals(mealEntities);

        // Save the plan
        plan = nutritionPlanRepository.save(plan);

        // Enroll user in the plan
        UserNutritionPlan userPlan = new UserNutritionPlan();
        userPlan.setUserId(user.getId());
        userPlan.setNutritionPlan(plan);
        userPlan.setStartDate(LocalDate.now());
        userPlan.setEndDate(LocalDate.now().plusDays(30));
        userPlan.setStatus("ACTIVE");
        userPlan.setCurrentDay(1);
        userPlan.setTotalMeals(mealEntities.size() * 30);

        return convertUserPlanToDTO(userNutritionPlanRepository.save(userPlan));
    }

    private String getStringVal(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private int getIntVal(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (NumberFormatException e) { return 0; }
        }
        return 0;
    }

    private double getDoubleVal(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).doubleValue();
        if (val instanceof String) {
            try { return Double.parseDouble((String) val); } catch (NumberFormatException e) { return 0.0; }
        }
        return 0.0;
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

