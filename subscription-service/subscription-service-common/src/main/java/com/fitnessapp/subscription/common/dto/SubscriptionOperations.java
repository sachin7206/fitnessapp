package com.fitnessapp.subscription.common.dto;

import java.util.List;

public interface SubscriptionOperations {
    List<SubscriptionPlanDTO> getAllPlans();
    SubscriptionPlanDTO getPlanById(Long planId);
    SubscriptionDTO getActiveSubscription(Long userId);
    SubscriptionDTO createSubscription(Long userId, CreateSubscriptionRequest request);
    SubscriptionDTO activateSubscription(Long subscriptionId, String transactionRef);
    List<SubscriptionDTO> getSubscriptionHistory(Long userId);
    void cancelSubscription(Long userId, Long subscriptionId);
}

