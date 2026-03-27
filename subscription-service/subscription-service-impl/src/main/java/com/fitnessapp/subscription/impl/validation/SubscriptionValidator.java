package com.fitnessapp.subscription.impl.validation;

import com.fitnessapp.subscription.impl.model.Subscription;
import com.fitnessapp.subscription.impl.model.SubscriptionPlan;
import com.fitnessapp.subscription.impl.repository.SubscriptionPlanRepository;
import com.fitnessapp.subscription.impl.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for subscription operations.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionValidator {

    private final SubscriptionPlanRepository planRepo;
    private final SubscriptionRepository subscriptionRepo;

    /**
     * Validate and retrieve a subscription plan by ID.
     */
    public SubscriptionPlan validatePlanExists(Long planId) {
        return planRepo.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found: " + planId));
    }

    /**
     * Validate and retrieve a subscription by ID.
     */
    public Subscription validateSubscriptionExists(Long subscriptionId) {
        return subscriptionRepo.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found: " + subscriptionId));
    }

    /**
     * Validate and retrieve a subscription by ID and user ID.
     */
    public Subscription validateSubscriptionExistsForUser(Long subscriptionId, Long userId) {
        return subscriptionRepo.findByIdAndUserId(subscriptionId, userId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
    }

    /**
     * Validate that a subscription is not already active.
     */
    public void validateNotAlreadyActive(Subscription subscription) {
        if ("ACTIVE".equals(subscription.getStatus())) {
            throw new RuntimeException("Subscription is already active");
        }
    }
}

