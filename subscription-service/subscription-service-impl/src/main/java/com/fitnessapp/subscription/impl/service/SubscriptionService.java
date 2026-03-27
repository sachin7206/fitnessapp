package com.fitnessapp.subscription.impl.service;

import com.fitnessapp.subscription.common.dto.*;
import com.fitnessapp.subscription.impl.model.Subscription;
import com.fitnessapp.subscription.impl.model.SubscriptionPlan;
import com.fitnessapp.subscription.impl.repository.SubscriptionPlanRepository;
import com.fitnessapp.subscription.impl.repository.SubscriptionRepository;
import com.fitnessapp.subscription.impl.validation.SubscriptionValidator;
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
    private final SubscriptionValidator subscriptionValidator;

    @Override
    public List<SubscriptionPlanDTO> getAllPlans() {
        return planRepo.findByIsActiveTrue().stream()
                .map(this::toPlanDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SubscriptionPlanDTO getPlanById(Long planId) {
        return toPlanDTO(subscriptionValidator.validatePlanExists(planId));
    }

    @Override
    public SubscriptionDTO getActiveSubscription(Long userId) {
        return subscriptionRepo.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE")
                .filter(s -> s.getEndDate() == null || !s.getEndDate().isBefore(LocalDate.now()))
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public SubscriptionDTO createSubscription(Long userId, CreateSubscriptionRequest request) {
        SubscriptionPlan newPlan = subscriptionValidator.validatePlanExists(request.getPlanId());

        // If user already has an active subscription, cancel it (upgrade flow)
        subscriptionRepo.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE")
                .filter(s -> s.getEndDate() == null || !s.getEndDate().isBefore(LocalDate.now()))
                .ifPresent(existing -> {
                    existing.setStatus("UPGRADED");
                    subscriptionRepo.save(existing);
                    log.info("Cancelled existing subscription {} for userId {} (upgrading to plan {})",
                            existing.getId(), userId, newPlan.getName());
                });

        Subscription subscription = new Subscription();
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
            log.info("Auto-activated FREE subscription {} for userId {} until {}", subscription.getId(), userId, subscription.getEndDate());
        } else {
            subscription.setStatus("PENDING_PAYMENT");
            subscription = subscriptionRepo.save(subscription);
            log.info("Created pending subscription {} for userId {}", subscription.getId(), userId);
        }

        return toDTO(subscription);
    }

    @Override
    @Transactional
    public SubscriptionDTO activateSubscription(Long subscriptionId, String transactionRef) {
        Subscription subscription = subscriptionValidator.validateSubscriptionExists(subscriptionId);
        subscriptionValidator.validateNotAlreadyActive(subscription);

        LocalDate startDate = LocalDate.now();
        int months = subscription.getPlan().getDurationMonths() != null ? subscription.getPlan().getDurationMonths() : 3;

        subscription.setStartDate(startDate);
        subscription.setEndDate(startDate.plusMonths(months));
        subscription.setStatus("ACTIVE");
        subscription.setTransactionRef(transactionRef);

        subscription = subscriptionRepo.save(subscription);
        log.info("Activated subscription {} for userId {} until {}", subscriptionId, subscription.getUserId(), subscription.getEndDate());
        return toDTO(subscription);
    }

    @Override
    public List<SubscriptionDTO> getSubscriptionHistory(Long userId) {
        return subscriptionRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelSubscription(Long userId, Long subscriptionId) {
        Subscription subscription = subscriptionValidator.validateSubscriptionExistsForUser(subscriptionId, userId);
        subscription.setStatus("CANCELLED");
        subscriptionRepo.save(subscription);
        log.info("Cancelled subscription {} for userId {}", subscriptionId, userId);
    }

    private SubscriptionDTO toDTO(Subscription s) {
        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setId(s.getId());
        dto.setUserId(s.getUserId());
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



