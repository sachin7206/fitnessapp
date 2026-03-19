package com.fitnessapp.subscription.common.dto;

import java.util.List;

public interface SubscriptionOperations {
    List<SubscriptionPlanDTO> getAllPlans();
    SubscriptionPlanDTO getPlanById(Long planId);
    SubscriptionDTO getActiveSubscription(String email);
    SubscriptionDTO createSubscription(String email, Long userId, CreateSubscriptionRequest request);
    SubscriptionDTO activateSubscription(Long subscriptionId, String transactionRef);
    List<SubscriptionDTO> getSubscriptionHistory(String email);
    void cancelSubscription(String email, Long subscriptionId);
}

