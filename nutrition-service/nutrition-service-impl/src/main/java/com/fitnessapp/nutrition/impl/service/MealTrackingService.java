package com.fitnessapp.nutrition.impl.service;

import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.nutrition.impl.model.DailyMealTracking;
import com.fitnessapp.nutrition.impl.model.DailyNutritionSummary;
import com.fitnessapp.nutrition.impl.repository.DailyMealTrackingRepository;
import com.fitnessapp.nutrition.impl.repository.DailyNutritionSummaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealTrackingService implements MealTrackingOperations {

    private final DailyMealTrackingRepository mealTrackingRepo;
    private final DailyNutritionSummaryRepository summaryRepo;

    @Override
    @Transactional
    public DailyNutritionSummaryDTO syncDailyTracking(Long userId, DailyTrackingSyncRequest request) {
        LocalDate today = LocalDate.now();

        // Validate replaced meals have required macro details
        if (request.getMeals() != null) {
            for (MealCompletionRequest mealReq : request.getMeals()) {
                if (Boolean.TRUE.equals(mealReq.getReplaced())) {
                    if (mealReq.getReplacedWith() == null || mealReq.getReplacedWith().trim().isEmpty()) {
                        throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have a food name (replacedWith)");
                    }
                    if (mealReq.getProteinGrams() == null || mealReq.getProteinGrams() < 0) {
                        throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have valid protein value (≥ 0)");
                    }
                    if (mealReq.getCarbsGrams() == null || mealReq.getCarbsGrams() < 0) {
                        throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have valid carbs value (≥ 0)");
                    }
                    if (mealReq.getFatGrams() == null || mealReq.getFatGrams() < 0) {
                        throw new IllegalArgumentException("Replaced meal (mealId=" + mealReq.getMealId() + ") must have valid fat value (≥ 0)");
                    }
                }
            }
        }

        // Upsert each meal record (deduplicate by mealId — keep last occurrence)
        if (request.getMeals() != null) {
            // Deduplicate: if same mealId appears multiple times, keep last
            java.util.Map<Long, MealCompletionRequest> uniqueMeals = new java.util.LinkedHashMap<>();
            for (MealCompletionRequest mealReq : request.getMeals()) {
                if (mealReq.getMealId() != null) {
                    uniqueMeals.put(mealReq.getMealId(), mealReq);
                }
            }

            for (MealCompletionRequest mealReq : uniqueMeals.values()) {
                try {
                    DailyMealTracking record = mealTrackingRepo
                            .findByUserIdAndTrackingDateAndMealId(userId, today, mealReq.getMealId())
                            .orElseGet(() -> {
                                DailyMealTracking r = new DailyMealTracking();
                                r.setUserId(userId);
                                r.setTrackingDate(today);
                                r.setMealId(mealReq.getMealId());
                                return r;
                            });
                    record.setMealName(mealReq.getMealName());
                    record.setMealType(mealReq.getMealType());
                    record.setTimeOfDay(mealReq.getTimeOfDay());
                    record.setCompleted(mealReq.getCompleted() != null ? mealReq.getCompleted() : false);
                    record.setCompletedAt(mealReq.getCompletedAt() != null ? LocalDateTime.parse(mealReq.getCompletedAt()) : null);
                    record.setReplaced(mealReq.getReplaced() != null ? mealReq.getReplaced() : false);
                    record.setReplacedWith(mealReq.getReplacedWith());
                    record.setOriginalName(mealReq.getOriginalName());
                    record.setCalories(mealReq.getCalories() != null ? mealReq.getCalories() : 0);
                    record.setProteinGrams(mealReq.getProteinGrams() != null ? mealReq.getProteinGrams() : 0.0);
                    record.setCarbsGrams(mealReq.getCarbsGrams() != null ? mealReq.getCarbsGrams() : 0.0);
                    record.setFatGrams(mealReq.getFatGrams() != null ? mealReq.getFatGrams() : 0.0);
                    mealTrackingRepo.saveAndFlush(record);
                } catch (Exception e) {
                    // Duplicate key on concurrent requests — retry with find
                    log.warn("Duplicate meal tracking entry for mealId={}, retrying update: {}", mealReq.getMealId(), e.getMessage());
                    mealTrackingRepo.findByUserIdAndTrackingDateAndMealId(userId, today, mealReq.getMealId())
                            .ifPresent(existing -> {
                                existing.setCompleted(mealReq.getCompleted() != null ? mealReq.getCompleted() : false);
                                existing.setCalories(mealReq.getCalories() != null ? mealReq.getCalories() : 0);
                                existing.setProteinGrams(mealReq.getProteinGrams() != null ? mealReq.getProteinGrams() : 0.0);
                                existing.setCarbsGrams(mealReq.getCarbsGrams() != null ? mealReq.getCarbsGrams() : 0.0);
                                existing.setFatGrams(mealReq.getFatGrams() != null ? mealReq.getFatGrams() : 0.0);
                                mealTrackingRepo.saveAndFlush(existing);
                            });
                }
            }
        }

        // Recalculate daily summary from actual DB meal records (only completed meals count)
        List<DailyMealTracking> allMealsToday = mealTrackingRepo.findByUserIdAndTrackingDate(userId, today);

        int totalCalories = 0;
        double totalProtein = 0.0, totalCarbs = 0.0, totalFat = 0.0;
        int completedCount = 0;

        for (DailyMealTracking m : allMealsToday) {
            if (Boolean.TRUE.equals(m.getCompleted())) {
                totalCalories += m.getCalories() != null ? m.getCalories() : 0;
                totalProtein += m.getProteinGrams() != null ? m.getProteinGrams() : 0.0;
                totalCarbs += m.getCarbsGrams() != null ? m.getCarbsGrams() : 0.0;
                totalFat += m.getFatGrams() != null ? m.getFatGrams() : 0.0;
                completedCount++;
            }
        }

        DailyNutritionSummary summary = summaryRepo.findByUserIdAndTrackingDate(userId, today)
                .orElseGet(() -> {
                    DailyNutritionSummary s = new DailyNutritionSummary();
                    s.setUserId(userId);
                    s.setTrackingDate(today);
                    return s;
                });
        summary.setConsumedCalories(totalCalories);
        summary.setConsumedProtein(totalProtein);
        summary.setConsumedCarbs(totalCarbs);
        summary.setConsumedFat(totalFat);
        summary.setTotalMeals(allMealsToday.size());
        summary.setCompletedMeals(completedCount);
        summaryRepo.save(summary);

        return buildSummaryDTO(userId, today);
    }

    @Override
    public DailyNutritionSummaryDTO getTodayTracking(Long userId) {
        return buildSummaryDTO(userId, LocalDate.now());
    }

    private DailyNutritionSummaryDTO buildSummaryDTO(Long userId, LocalDate date) {
        List<DailyMealTracking> meals = mealTrackingRepo.findByUserIdAndTrackingDate(userId, date);

        // Always recalculate from actual completed meal records
        int totalCalories = 0;
        double totalProtein = 0.0, totalCarbs = 0.0, totalFat = 0.0;
        int completedCount = 0;

        for (DailyMealTracking m : meals) {
            if (Boolean.TRUE.equals(m.getCompleted())) {
                totalCalories += m.getCalories() != null ? m.getCalories() : 0;
                totalProtein += m.getProteinGrams() != null ? m.getProteinGrams() : 0.0;
                totalCarbs += m.getCarbsGrams() != null ? m.getCarbsGrams() : 0.0;
                totalFat += m.getFatGrams() != null ? m.getFatGrams() : 0.0;
                completedCount++;
            }
        }

        DailyNutritionSummaryDTO dto = new DailyNutritionSummaryDTO();
        dto.setTrackingDate(date);
        dto.setConsumedCalories(totalCalories);
        dto.setConsumedProtein(totalProtein);
        dto.setConsumedCarbs(totalCarbs);
        dto.setConsumedFat(totalFat);
        dto.setTotalMeals(meals.size());
        dto.setCompletedMeals(completedCount);
        dto.setMeals(meals.stream().map(this::toMealDTO).collect(Collectors.toList()));
        return dto;
    }

    private DailyMealTrackingDTO toMealDTO(DailyMealTracking m) {
        return new DailyMealTrackingDTO(
                m.getMealId(), m.getMealName(), m.getMealType(), m.getTimeOfDay(),
                m.getCompleted(), m.getCompletedAt() != null ? m.getCompletedAt().toString() : null,
                m.getReplaced(), m.getReplacedWith(), m.getOriginalName(),
                m.getCalories(), m.getProteinGrams(), m.getCarbsGrams(), m.getFatGrams()
        );
    }
}

