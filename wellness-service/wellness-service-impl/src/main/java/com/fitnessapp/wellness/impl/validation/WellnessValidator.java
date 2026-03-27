package com.fitnessapp.wellness.impl.validation;

import com.fitnessapp.wellness.impl.model.WellnessPlan;
import com.fitnessapp.wellness.impl.repository.WellnessPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for wellness service operations.
 */
@Component
@RequiredArgsConstructor
public class WellnessValidator {

    private final WellnessPlanRepository planRepo;

    /**
     * Validate and retrieve a wellness plan by ID.
     */
    public WellnessPlan validatePlanExists(Long planId) {
        return planRepo.findById(planId)
                .orElseThrow(() -> new RuntimeException("Wellness plan not found"));
    }
}

