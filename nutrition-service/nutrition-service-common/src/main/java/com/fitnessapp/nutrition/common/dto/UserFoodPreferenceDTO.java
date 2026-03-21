package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
    @Min(value = 0, message = "Eggs per day must be ≥ 0")
    @Max(value = 12, message = "Eggs per day must be ≤ 12")
    private Integer eggsPerDay;
    private Boolean includeRice;
    private Boolean includeRoti;
    private Boolean includeDal;
    private Boolean includeMilk;
    private Boolean includePaneer;
    private Boolean includeCurd;
    @Size(max = 50, message = "Cooking oil preference must be ≤ 50 characters")
    private String cookingOilPreference;
    private Boolean preferHomemade;
    @Size(max = 20, message = "Cannot have more than 20 allergies")
    private List<@Size(max = 100, message = "Each allergy must be ≤ 100 characters") String> allergies;
    @Size(max = 50, message = "Cannot have more than 50 disliked foods")
    private List<@Size(max = 100, message = "Each disliked food must be ≤ 100 characters") String> dislikedFoods;
    @Size(max = 20, message = "Cannot have more than 20 custom meals")
    private List<Map<String, Object>> customMeals;
    private Boolean includePreWorkout;
    @Size(max = 20, message = "Pre-workout time must be ≤ 20 characters")
    private String preWorkoutTime;
    private Boolean includePostWorkout;
    @Size(max = 20, message = "Post-workout time must be ≤ 20 characters")
    private String postWorkoutTime;
    private Boolean canTakeWheyProtein;
    @Size(max = 20, message = "Cannot have more than 20 supplements")
    private List<@Size(max = 100, message = "Each supplement must be ≤ 100 characters") String> supplements;
    @Size(max = 50, message = "Region must be ≤ 50 characters")
    private String region;
}

