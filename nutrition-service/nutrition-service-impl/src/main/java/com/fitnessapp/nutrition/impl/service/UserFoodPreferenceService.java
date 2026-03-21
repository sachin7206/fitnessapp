package com.fitnessapp.nutrition.impl.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.nutrition.common.dto.FoodPreferenceOperations;
import com.fitnessapp.nutrition.common.dto.UserFoodPreferenceDTO;
import com.fitnessapp.nutrition.impl.model.UserFoodPreference;
import com.fitnessapp.nutrition.impl.repository.UserFoodPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service @RequiredArgsConstructor @Slf4j
public class UserFoodPreferenceService implements FoodPreferenceOperations {
    private final UserFoodPreferenceRepository repo;
    private final ObjectMapper objectMapper;

    public UserFoodPreferenceDTO getFoodPreferences(Long userId) {
        return repo.findByUserId(userId).map(this::toDTO).orElse(null);
    }

    @Transactional
    public UserFoodPreferenceDTO saveFoodPreferences(Long userId, UserFoodPreferenceDTO dto) {
        UserFoodPreference pref = repo.findByUserId(userId).orElse(new UserFoodPreference());
        pref.setUserId(userId);
        pref.setIncludeChicken(dto.getIncludeChicken()); pref.setIncludeFish(dto.getIncludeFish());
        pref.setIncludeRedMeat(dto.getIncludeRedMeat()); pref.setEggsPerDay(dto.getEggsPerDay());
        pref.setIncludeRice(dto.getIncludeRice()); pref.setIncludeRoti(dto.getIncludeRoti());
        pref.setIncludeDal(dto.getIncludeDal()); pref.setIncludeMilk(dto.getIncludeMilk());
        pref.setIncludePaneer(dto.getIncludePaneer()); pref.setIncludeCurd(dto.getIncludeCurd());
        pref.setCookingOilPreference(dto.getCookingOilPreference());
        pref.setPreferHomemade(dto.getPreferHomemade());
        pref.setAllergies(dto.getAllergies() != null ? new ArrayList<>(dto.getAllergies()) : new ArrayList<>());
        pref.setDislikedFoods(dto.getDislikedFoods() != null ? new ArrayList<>(dto.getDislikedFoods()) : new ArrayList<>());
        if (dto.getCustomMeals() != null) {
            try { pref.setCustomMealsJson(objectMapper.writeValueAsString(dto.getCustomMeals())); }
            catch (JsonProcessingException e) { log.warn("Failed to serialize custom meals: {}", e.getMessage()); }
        }
        pref.setIncludePreWorkout(dto.getIncludePreWorkout()); pref.setPreWorkoutTime(dto.getPreWorkoutTime());
        pref.setIncludePostWorkout(dto.getIncludePostWorkout()); pref.setPostWorkoutTime(dto.getPostWorkoutTime());
        pref.setCanTakeWheyProtein(dto.getCanTakeWheyProtein());
        pref.setSupplements(dto.getSupplements() != null ? new ArrayList<>(dto.getSupplements()) : new ArrayList<>());
        pref.setRegion(dto.getRegion());
        return toDTO(repo.save(pref));
    }

    private UserFoodPreferenceDTO toDTO(UserFoodPreference p) {
        UserFoodPreferenceDTO d = new UserFoodPreferenceDTO();
        d.setIncludeChicken(p.getIncludeChicken()); d.setIncludeFish(p.getIncludeFish());
        d.setIncludeRedMeat(p.getIncludeRedMeat()); d.setEggsPerDay(p.getEggsPerDay());
        d.setIncludeRice(p.getIncludeRice()); d.setIncludeRoti(p.getIncludeRoti());
        d.setIncludeDal(p.getIncludeDal()); d.setIncludeMilk(p.getIncludeMilk());
        d.setIncludePaneer(p.getIncludePaneer()); d.setIncludeCurd(p.getIncludeCurd());
        d.setCookingOilPreference(p.getCookingOilPreference()); d.setPreferHomemade(p.getPreferHomemade());
        d.setAllergies(p.getAllergies() != null ? new ArrayList<>(p.getAllergies()) : new ArrayList<>());
        d.setDislikedFoods(p.getDislikedFoods() != null ? new ArrayList<>(p.getDislikedFoods()) : new ArrayList<>());
        if (p.getCustomMealsJson() != null && !p.getCustomMealsJson().isEmpty()) {
            try { d.setCustomMeals(objectMapper.readValue(p.getCustomMealsJson(), new TypeReference<>() {})); }
            catch (JsonProcessingException e) { d.setCustomMeals(new ArrayList<>()); }
        } else { d.setCustomMeals(new ArrayList<>()); }
        d.setIncludePreWorkout(p.getIncludePreWorkout()); d.setPreWorkoutTime(p.getPreWorkoutTime());
        d.setIncludePostWorkout(p.getIncludePostWorkout()); d.setPostWorkoutTime(p.getPostWorkoutTime());
        d.setCanTakeWheyProtein(p.getCanTakeWheyProtein());
        d.setSupplements(p.getSupplements() != null ? new ArrayList<>(p.getSupplements()) : new ArrayList<>());
        d.setRegion(p.getRegion());
        return d;
    }
}
