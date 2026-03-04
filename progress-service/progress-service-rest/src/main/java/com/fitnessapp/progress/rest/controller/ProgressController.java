package com.fitnessapp.progress.rest.controller;

import com.fitnessapp.progress.common.dto.*;
import com.fitnessapp.progress.rest.api.ProgressApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProgressController implements ProgressApi {
    private final ProgressTrackingOperations progressService;
    private final ProgressEnhancementOperations progressEnhancementService;

    private String getCurrentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @Override
    public ResponseEntity<WeightEntryDTO> logWeight(Object body) {
        Map<String, Object> map = (Map<String, Object>) body;
        Double weight = map.get("weight") != null ? ((Number) map.get("weight")).doubleValue() : null;
        String unit = (String) map.getOrDefault("unit", "kg");
        Double bmi = map.get("bmi") != null ? ((Number) map.get("bmi")).doubleValue() : null;
        Double bodyFat = map.get("bodyFatPercentage") != null ? ((Number) map.get("bodyFatPercentage")).doubleValue() : null;
        String notes = (String) map.get("notes");
        return ResponseEntity.ok(progressService.logWeight(getCurrentEmail(), weight, unit, bmi, bodyFat, notes));
    }

    @Override
    public ResponseEntity<List<WeightEntryDTO>> getWeightEntries(Integer days) {
        return ResponseEntity.ok(progressService.getWeightEntries(getCurrentEmail(), days != null ? days : 90));
    }

    @Override
    public ResponseEntity<BodyMeasurementDTO> logMeasurements(BodyMeasurementDTO dto) {
        return ResponseEntity.ok(progressService.logMeasurements(getCurrentEmail(), dto));
    }

    @Override
    public ResponseEntity<List<BodyMeasurementDTO>> getMeasurements(Integer days) {
        return ResponseEntity.ok(progressService.getMeasurements(getCurrentEmail(), days != null ? days : 90));
    }

    @Override
    public ResponseEntity<ProgressGoalDTO> setGoal(ProgressGoalDTO dto) {
        return ResponseEntity.ok(progressService.setGoal(getCurrentEmail(), dto));
    }

    @Override
    public ResponseEntity<List<ProgressGoalDTO>> getGoals() {
        return ResponseEntity.ok(progressService.getGoals(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<ProgressSummaryDTO> getSummary(String period) {
        return ResponseEntity.ok(progressService.getSummary(getCurrentEmail(), period != null ? period : "monthly"));
    }

    @Override
    public ResponseEntity<TrendDataDTO> getTrends(Integer days) {
        return ResponseEntity.ok(progressService.getTrends(getCurrentEmail(), days != null ? days : 30));
    }

    // ========== NEW FEATURE ENDPOINTS ==========

    @Override
    public ResponseEntity<WeeklyReportDTO> getWeeklyReport() {
        return ResponseEntity.ok(progressEnhancementService.getWeeklyReport(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<PlateauAnalysisDTO> getPlateauAnalysis(Integer days) {
        return ResponseEntity.ok(progressEnhancementService.getPlateauAnalysis(getCurrentEmail(), days != null ? days : 30));
    }

    @Override
    public ResponseEntity<AchievementsDTO> getAchievements() {
        return ResponseEntity.ok(progressEnhancementService.getAchievements(getCurrentEmail()));
    }
}
