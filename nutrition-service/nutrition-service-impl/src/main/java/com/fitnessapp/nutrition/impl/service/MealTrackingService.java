package com.fitnessapp.nutrition.impl.service;

import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.nutrition.impl.model.DailyMealTracking;
import com.fitnessapp.nutrition.impl.model.DailyNutritionSummary;
import com.fitnessapp.nutrition.impl.model.NutritionPlan;
import com.fitnessapp.nutrition.impl.model.UserNutritionPlan;
import com.fitnessapp.nutrition.impl.repository.DailyMealTrackingRepository;
import com.fitnessapp.nutrition.impl.repository.DailyNutritionSummaryRepository;
import com.fitnessapp.nutrition.impl.repository.UserNutritionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealTrackingService implements MealTrackingOperations {

    private final DailyMealTrackingRepository mealTrackingRepo;
    private final DailyNutritionSummaryRepository summaryRepo;
    private final UserNutritionPlanRepository userNutritionPlanRepo;

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
                    record.setCompletedAt(parseCompletedAt(mealReq.getCompletedAt()));
                    record.setReplaced(mealReq.getReplaced() != null ? mealReq.getReplaced() : false);
                    record.setReplacedWith(mealReq.getReplacedWith());
                    record.setOriginalName(mealReq.getOriginalName());
                    record.setCalories(mealReq.getCalories() != null ? mealReq.getCalories() : 0);
                    record.setProteinGrams(mealReq.getProteinGrams() != null ? mealReq.getProteinGrams() : 0.0);
                    record.setCarbsGrams(mealReq.getCarbsGrams() != null ? mealReq.getCarbsGrams() : 0.0);
                    record.setFatGrams(mealReq.getFatGrams() != null ? mealReq.getFatGrams() : 0.0);
                    record.setIsExtra(mealReq.getIsExtra() != null ? mealReq.getIsExtra() : false);
                    record.setFoodItemsJson(mealReq.getFoodItemsJson());
                    // Persist original macros only if meal is actually replaced; clear stale data otherwise
                    if (Boolean.TRUE.equals(mealReq.getReplaced())) {
                        record.setOriginalCalories(mealReq.getOriginalCalories());
                        record.setOriginalProteinGrams(mealReq.getOriginalProteinGrams());
                        record.setOriginalCarbsGrams(mealReq.getOriginalCarbsGrams());
                        record.setOriginalFatGrams(mealReq.getOriginalFatGrams());
                    } else {
                        record.setOriginalCalories(null);
                        record.setOriginalProteinGrams(null);
                        record.setOriginalCarbsGrams(null);
                        record.setOriginalFatGrams(null);
                    }
                    mealTrackingRepo.saveAndFlush(record);
                } catch (Exception e) {
                    // Duplicate key on concurrent requests — retry with find
                    log.warn("Duplicate meal tracking entry for mealId={}, retrying update: {}", mealReq.getMealId(), e.getMessage());
                    mealTrackingRepo.findByUserIdAndTrackingDateAndMealId(userId, today, mealReq.getMealId())
                            .ifPresent(existing -> {
                                existing.setMealName(mealReq.getMealName());
                                existing.setCompleted(mealReq.getCompleted() != null ? mealReq.getCompleted() : false);
                                existing.setCompletedAt(parseCompletedAt(mealReq.getCompletedAt()));
                                existing.setReplaced(mealReq.getReplaced() != null ? mealReq.getReplaced() : false);
                                existing.setReplacedWith(mealReq.getReplacedWith());
                                existing.setOriginalName(mealReq.getOriginalName());
                                existing.setCalories(mealReq.getCalories() != null ? mealReq.getCalories() : 0);
                                existing.setProteinGrams(mealReq.getProteinGrams() != null ? mealReq.getProteinGrams() : 0.0);
                                existing.setCarbsGrams(mealReq.getCarbsGrams() != null ? mealReq.getCarbsGrams() : 0.0);
                                existing.setFatGrams(mealReq.getFatGrams() != null ? mealReq.getFatGrams() : 0.0);
                                existing.setIsExtra(mealReq.getIsExtra() != null ? mealReq.getIsExtra() : false);
                                existing.setFoodItemsJson(mealReq.getFoodItemsJson());
                                // Persist original macros only if meal is actually replaced; clear stale data otherwise
                                if (Boolean.TRUE.equals(mealReq.getReplaced())) {
                                    existing.setOriginalCalories(mealReq.getOriginalCalories());
                                    existing.setOriginalProteinGrams(mealReq.getOriginalProteinGrams());
                                    existing.setOriginalCarbsGrams(mealReq.getOriginalCarbsGrams());
                                    existing.setOriginalFatGrams(mealReq.getOriginalFatGrams());
                                } else {
                                    existing.setOriginalCalories(null);
                                    existing.setOriginalProteinGrams(null);
                                    existing.setOriginalCarbsGrams(null);
                                    existing.setOriginalFatGrams(null);
                                }
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
        DailyMealTrackingDTO dto = new DailyMealTrackingDTO();
        dto.setMealId(m.getMealId());
        dto.setMealName(m.getMealName());
        dto.setMealType(m.getMealType());
        dto.setTimeOfDay(m.getTimeOfDay());
        dto.setCompleted(m.getCompleted());
        dto.setCompletedAt(m.getCompletedAt() != null ? m.getCompletedAt().toString() : null);
        dto.setReplaced(m.getReplaced());
        dto.setReplacedWith(m.getReplacedWith());
        dto.setOriginalName(m.getOriginalName());
        dto.setCalories(m.getCalories());
        dto.setProteinGrams(m.getProteinGrams());
        dto.setCarbsGrams(m.getCarbsGrams());
        dto.setFatGrams(m.getFatGrams());
        dto.setOriginalCalories(m.getOriginalCalories());
        dto.setOriginalProteinGrams(m.getOriginalProteinGrams());
        dto.setOriginalCarbsGrams(m.getOriginalCarbsGrams());
        dto.setOriginalFatGrams(m.getOriginalFatGrams());
        dto.setIsExtra(m.getIsExtra());
        dto.setFoodItemsJson(m.getFoodItemsJson());
        return dto;
    }

    /**
     * Safely parse completedAt strings like "2026-03-22T14:20:44.793Z" or "2026-03-22T14:20:44.793".
     * Handles ISO-8601 with Z (UTC), offset (+05:30), or plain LocalDateTime formats.
     */
    private LocalDateTime parseCompletedAt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e1) {
            try {
                return OffsetDateTime.parse(value).toLocalDateTime();
            } catch (DateTimeParseException e2) {
                try {
                    return ZonedDateTime.parse(value).toLocalDateTime();
                } catch (DateTimeParseException e3) {
                    log.warn("Unable to parse completedAt value '{}', ignoring", value);
                    return null;
                }
            }
        }
    }

    @Override
    public DietReportDTO getDietReport(Long userId, LocalDate startDate, LocalDate endDate) {
        List<DailyNutritionSummary> summaries = summaryRepo
                .findByUserIdAndTrackingDateBetweenOrderByTrackingDateAsc(userId, startDate, endDate);

        // Get target from active nutrition plan
        DietReportDTO.MacroTargets targets = new DietReportDTO.MacroTargets(2000, 100, 250, 65);
        try {
            userNutritionPlanRepo.findActiveByUserId(userId).ifPresent(unp -> {
                NutritionPlan plan = unp.getNutritionPlan();
                if (plan != null) {
                    targets.setTargetCalories(plan.getTotalCalories() != null ? plan.getTotalCalories() : 2000);
                    targets.setTargetProtein(plan.getProteinGrams() != null ? plan.getProteinGrams() : 100);
                    targets.setTargetCarbs(plan.getCarbsGrams() != null ? plan.getCarbsGrams() : 250);
                    targets.setTargetFat(plan.getFatGrams() != null ? plan.getFatGrams() : 65);
                }
            });
        } catch (Exception e) {
            log.warn("Could not fetch nutrition plan for report: {}", e.getMessage());
        }

        List<DietReportDTO.DailyEntry> breakdown = new java.util.ArrayList<>();
        long totalCal = 0, totalP = 0, totalC = 0, totalF = 0;

        for (DailyNutritionSummary s : summaries) {
            int cal = s.getConsumedCalories() != null ? s.getConsumedCalories() : 0;
            double p = s.getConsumedProtein() != null ? s.getConsumedProtein() : 0;
            double c = s.getConsumedCarbs() != null ? s.getConsumedCarbs() : 0;
            double f = s.getConsumedFat() != null ? s.getConsumedFat() : 0;

            DietReportDTO.DailyEntry entry = new DietReportDTO.DailyEntry();
            entry.setDate(s.getTrackingDate().toString());
            entry.setCalories(cal);
            entry.setProtein(p);
            entry.setCarbs(c);
            entry.setFat(f);
            entry.setCompletedMeals(s.getCompletedMeals() != null ? s.getCompletedMeals() : 0);
            entry.setTotalMeals(s.getTotalMeals() != null ? s.getTotalMeals() : 0);
            entry.setCalorieVariance(cal - targets.getTargetCalories());
            entry.setProteinVariance(p - targets.getTargetProtein());
            entry.setCarbsVariance(c - targets.getTargetCarbs());
            entry.setFatVariance(f - targets.getTargetFat());
            breakdown.add(entry);

            totalCal += cal;
            totalP += p;
            totalC += c;
            totalF += f;
        }

        int count = summaries.size();
        DietReportDTO.MacroTotals averages = new DietReportDTO.MacroTotals(
                count > 0 ? (int) (totalCal / count) : 0,
                count > 0 ? Math.round((double) totalP / count * 10) / 10.0 : 0,
                count > 0 ? Math.round((double) totalC / count * 10) / 10.0 : 0,
                count > 0 ? Math.round((double) totalF / count * 10) / 10.0 : 0
        );

        DietReportDTO report = new DietReportDTO();
        report.setStartDate(startDate.toString());
        report.setEndDate(endDate.toString());
        report.setTotalTrackedDays(count);
        report.setTargets(targets);
        report.setDailyBreakdown(breakdown);
        report.setAverages(averages);
        return report;
    }
}

