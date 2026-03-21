package com.fitnessapp.nutrition.common.dto;

import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;

public interface NutritionProfileOperations {
    ProfileCompletionStatusDTO getProfileCompletion(Long userId);
}
