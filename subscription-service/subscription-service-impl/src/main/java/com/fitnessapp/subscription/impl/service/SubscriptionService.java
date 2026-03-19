package com.fitnessapp.subscription.impl.service;

import com.fitnessapp.subscription.common.dto.*;
import com.fitnessapp.subscription.impl.model.Subscription;
import com.fitnessapp.subscription.impl.model.SubscriptionPlan;
import com.fitnessapp.subscription.impl.repository.SubscriptionPlanRepository;
import com.fitnessapp.subscription.impl.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService implements SubscriptionOperations {

    private final SubscriptionPlanRepository planRepo;
    private final SubscriptionRepository subscriptionRepo;

    @Override
    public List<SubscriptionPlanDTO> getAllPlans() {
        return planRepo.findByIsActiveTrue().stream()
                .map(this::toPlanDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SubscriptionPlanDTO getPlanById(Long planId) {
        return planRepo.findById(planId)
                .map(this::toPlanDTO)
                .orElseThrow(() -> new RuntimeException("Plan not found: " + planId));
    }

    @Override
    public SubscriptionDTO getActiveSubscription(String email) {
        return subscriptionRepo.findFirstByUserEmailAndStatusOrderByCreatedAtDesc(email, "ACTIVE")
                .filter(s -> s.getEndDate() == null || !s.getEndDate().isBefore(LocalDate.now()))
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public SubscriptionDTO createSubscription(String email, Long userId, CreateSubscriptionRequest request) {
        SubscriptionPlan newPlan = planRepo.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found: " + request.getPlanId()));

        // If user already has an active subscription, cancel it (upgrade flow)
        subscriptionRepo.findFirstByUserEmailAndStatusOrderByCreatedAtDesc(email, "ACTIVE")
                .filter(s -> s.getEndDate() == null || !s.getEndDate().isBefore(LocalDate.now()))
                .ifPresent(existing -> {
                    existing.setStatus("UPGRADED");
                    subscriptionRepo.save(existing);
                    log.info("Cancelled existing subscription {} for user {} (upgrading to plan {})",
                            existing.getId(), email, newPlan.getName());
                });

        Subscription subscription = new Subscription();
        subscription.setUserEmail(email);
        subscription.setUserId(userId);
        subscription.setPlan(newPlan);

        // Free plan (price == 0) → auto-activate immediately, no payment needed
        boolean isFree = newPlan.getPrice() != null && newPlan.getPrice().compareTo(java.math.BigDecimal.ZERO) == 0;
        if (isFree) {
            LocalDate startDate = LocalDate.now();
            int months = newPlan.getDurationMonths() != null ? newPlan.getDurationMonths() : 1;
            subscription.setStatus("ACTIVE");
            subscription.setStartDate(startDate);
            subscription.setEndDate(startDate.plusMonths(months));
            subscription.setTransactionRef("FREE");
            subscription = subscriptionRepo.save(subscription);
            log.info("Auto-activated FREE subscription {} for user {} until {}", subscription.getId(), email, subscription.getEndDate());
        } else {
            subscription.setStatus("PENDING_PAYMENT");
            subscription = subscriptionRepo.save(subscription);
            log.info("Created pending subscription {} for user {}", subscription.getId(), email);
        }

        return toDTO(subscription);
    }

    @Override
    @Transactional
    public SubscriptionDTO activateSubscription(Long subscriptionId, String transactionRef) {
        Subscription subscription = subscriptionRepo.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found: " + subscriptionId));

        if ("ACTIVE".equals(subscription.getStatus())) {
            throw new RuntimeException("Subscription is already active");
        }

        LocalDate startDate = LocalDate.now();
        int months = subscription.getPlan().getDurationMonths() != null ? subscription.getPlan().getDurationMonths() : 3;

        subscription.setStartDate(startDate);
        subscription.setEndDate(startDate.plusMonths(months));
        subscription.setStatus("ACTIVE");
        subscription.setTransactionRef(transactionRef);

        subscription = subscriptionRepo.save(subscription);
        log.info("Activated subscription {} for user {} until {}", subscriptionId, subscription.getUserEmail(), subscription.getEndDate());
        return toDTO(subscription);
    }

    @Override
    public List<SubscriptionDTO> getSubscriptionHistory(String email) {
        return subscriptionRepo.findByUserEmailOrderByCreatedAtDesc(email).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelSubscription(String email, Long subscriptionId) {
        Subscription subscription = subscriptionRepo.findByIdAndUserEmail(subscriptionId, email)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        subscription.setStatus("CANCELLED");
        subscriptionRepo.save(subscription);
        log.info("Cancelled subscription {} for user {}", subscriptionId, email);
    }

    private SubscriptionDTO toDTO(Subscription s) {
        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setId(s.getId());
        dto.setUserId(s.getUserId());
        dto.setUserEmail(s.getUserEmail());
        dto.setStartDate(s.getStartDate());
        dto.setEndDate(s.getEndDate());
        dto.setStatus(s.getStatus());
        dto.setTransactionRef(s.getTransactionRef());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());
        if (s.getPlan() != null) {
            dto.setPlanId(s.getPlan().getId());
            dto.setPlanName(s.getPlan().getName());
            dto.setPlanPrice(s.getPlan().getPrice());
            dto.setDurationMonths(s.getPlan().getDurationMonths());
        }
        return dto;
    }

    private SubscriptionPlanDTO toPlanDTO(SubscriptionPlan p) {
        SubscriptionPlanDTO dto = new SubscriptionPlanDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setDurationMonths(p.getDurationMonths());
        dto.setPrice(p.getPrice());
        dto.setCurrency(p.getCurrency());
        dto.setIsActive(p.getIsActive());
        dto.setFeatures(p.getFeatures());
        return dto;
    }
}



