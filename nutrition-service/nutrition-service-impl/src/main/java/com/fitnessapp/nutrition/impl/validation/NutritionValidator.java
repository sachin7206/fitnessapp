package com.fitnessapp.nutrition.impl.validation;

import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for nutrition service operations.
 */
@Component
public class NutritionValidator {

    /**
     * Validate that a nutrition plan exists (throw if not found).
     */
    public void validatePlanExists(Object plan, String message) {
        if (plan == null) {
            throw new RuntimeException(message);
        }
    }

    /**
     * Validate user authorization for a plan operation.
     */
    public void validateUserAuthorized(Long planUserId, Long requestUserId) {
        if (!planUserId.equals(requestUserId)) {
            throw new RuntimeException("Unauthorized");
        }
    }
}

