package com.fitnessapp.subscription.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import com.fitnessapp.subscription.common.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionOperations subscriptionOperations;
    private final HttpServletRequest httpServletRequest;


    private Long getCurrentUserId() {
        Object userId = httpServletRequest.getAttribute("userId");
        return userId instanceof Long ? (Long) userId : null;
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDTO>>> getPlans() {
        List<SubscriptionPlanDTO> plans = subscriptionOperations.getAllPlans();
        return ResponseEntity.ok(ApiResponse.success("Plans retrieved", plans));
    }

    @GetMapping("/plans/{planId}")
    public ResponseEntity<ApiResponse<SubscriptionPlanDTO>> getPlan(@PathVariable Long planId) {
        SubscriptionPlanDTO plan = subscriptionOperations.getPlanById(planId);
        return ResponseEntity.ok(ApiResponse.success("Plan retrieved", plan));
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> getActiveSubscription() {
        SubscriptionDTO subscription = subscriptionOperations.getActiveSubscription(getCurrentUserId());
        if (subscription == null) {
            return ResponseEntity.ok(ApiResponse.success("No active subscription", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Active subscription retrieved", subscription));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> subscribe(@RequestBody CreateSubscriptionRequest request) {
        SubscriptionDTO subscription = subscriptionOperations.createSubscription(
                getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Subscription created. Please complete payment.", subscription));
    }

    @PostMapping("/{subscriptionId}/activate")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> activateSubscription(
            @PathVariable Long subscriptionId,
            @RequestParam String transactionRef) {
        SubscriptionDTO subscription = subscriptionOperations.activateSubscription(subscriptionId, transactionRef);
        return ResponseEntity.ok(ApiResponse.success("Subscription activated", subscription));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SubscriptionDTO>>> getHistory() {
        List<SubscriptionDTO> history = subscriptionOperations.getSubscriptionHistory(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Subscription history retrieved", history));
    }

    @DeleteMapping("/{subscriptionId}")
    public ResponseEntity<ApiResponse<Void>> cancelSubscription(@PathVariable Long subscriptionId) {
        subscriptionOperations.cancelSubscription(getCurrentUserId(), subscriptionId);
        return ResponseEntity.ok(ApiResponse.success("Subscription cancelled", null));
    }
}

