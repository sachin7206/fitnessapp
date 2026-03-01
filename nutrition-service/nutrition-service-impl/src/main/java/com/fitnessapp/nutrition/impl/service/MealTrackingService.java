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
    public DailyNutritionSummaryDTO syncDailyTracking(String email, DailyTrackingSyncRequest request) {
        LocalDate today = LocalDate.now();

        // Upsert each meal record
        if (request.getMeals() != null) {
            for (MealCompletionRequest mealReq : request.getMeals()) {
                DailyMealTracking record = mealTrackingRepo
                        .findByUserEmailAndTrackingDateAndMealId(email, today, mealReq.getMealId())
                        .orElseGet(() -> {
                            DailyMealTracking r = new DailyMealTracking();
                            r.setUserEmail(email);
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
                mealTrackingRepo.save(record);
            }
        }

        // Upsert daily summary
        DailyNutritionSummary summary = summaryRepo.findByUserEmailAndTrackingDate(email, today)
                .orElseGet(() -> {
                    DailyNutritionSummary s = new DailyNutritionSummary();
                    s.setUserEmail(email);
                    s.setTrackingDate(today);
                    return s;
                });
        summary.setConsumedCalories(request.getConsumedCalories() != null ? request.getConsumedCalories() : 0);
        summary.setConsumedProtein(request.getConsumedProtein() != null ? request.getConsumedProtein() : 0.0);
        summary.setConsumedCarbs(request.getConsumedCarbs() != null ? request.getConsumedCarbs() : 0.0);
        summary.setConsumedFat(request.getConsumedFat() != null ? request.getConsumedFat() : 0.0);
        summary.setTotalMeals(request.getMeals() != null ? request.getMeals().size() : 0);
        summary.setCompletedMeals(request.getMeals() != null
                ? (int) request.getMeals().stream().filter(m -> Boolean.TRUE.equals(m.getCompleted())).count()
                : 0);
        summaryRepo.save(summary);

        return buildSummaryDTO(email, today);
    }

    @Override
    public DailyNutritionSummaryDTO getTodayTracking(String email) {
        return buildSummaryDTO(email, LocalDate.now());
    }

    private DailyNutritionSummaryDTO buildSummaryDTO(String email, LocalDate date) {
        List<DailyMealTracking> meals = mealTrackingRepo.findByUserEmailAndTrackingDate(email, date);
        DailyNutritionSummary summary = summaryRepo.findByUserEmailAndTrackingDate(email, date).orElse(null);

        DailyNutritionSummaryDTO dto = new DailyNutritionSummaryDTO();
        dto.setTrackingDate(date);
        dto.setConsumedCalories(summary != null ? summary.getConsumedCalories() : 0);
        dto.setConsumedProtein(summary != null ? summary.getConsumedProtein() : 0.0);
        dto.setConsumedCarbs(summary != null ? summary.getConsumedCarbs() : 0.0);
        dto.setConsumedFat(summary != null ? summary.getConsumedFat() : 0.0);
        dto.setTotalMeals(summary != null ? summary.getTotalMeals() : 0);
        dto.setCompletedMeals(summary != null ? summary.getCompletedMeals() : 0);
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

