package com.fitnessapp.nutrition.impl.service;

import com.fitnessapp.nutrition.common.dto.NutritionProfileOperations;
import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import com.fitnessapp.user.common.dto.UserDto;
import com.fitnessapp.user.sal.UserServiceSalClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Wraps SAL calls to User Service for nutrition-related profile checks.
 */
@Service
@RequiredArgsConstructor
public class NutritionProfileService implements NutritionProfileOperations {

    private final UserServiceSalClient userServiceSalClient;

    public ProfileCompletionStatusDTO getProfileCompletion(Long userId) {
        UserDto user = userServiceSalClient.getUserById(userId);
        return userServiceSalClient.getProfileCompletion(user.getEmail());
    }

    public Boolean isProfileCompleteForNutrition(String email) {
        return userServiceSalClient.isProfileCompleteForNutrition(email);
    }
}
