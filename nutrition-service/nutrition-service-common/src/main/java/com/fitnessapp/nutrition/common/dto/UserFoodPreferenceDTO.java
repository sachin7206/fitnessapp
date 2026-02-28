package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor
public class UserFoodPreferenceDTO {
    private Boolean includeChicken;
    private Boolean includeFish;
    private Boolean includeRedMeat;
    private Integer eggsPerDay;
    private Boolean includeRice;
    private Boolean includeRoti;
    private Boolean includeDal;
    private Boolean includeMilk;
    private Boolean includePaneer;
    private Boolean includeCurd;
    private String cookingOilPreference;
    private Boolean preferHomemade;
    private List<String> allergies;
    private List<String> dislikedFoods;
    private List<Map<String, Object>> customMeals;
    private Boolean includePreWorkout;
    private String preWorkoutTime;
    private Boolean includePostWorkout;
    private String postWorkoutTime;
    private Boolean canTakeWheyProtein;
    private List<String> supplements;
    private String region;
}

