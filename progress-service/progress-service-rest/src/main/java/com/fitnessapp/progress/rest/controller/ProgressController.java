package com.fitnessapp.progress.rest.controller;

import com.fitnessapp.progress.common.dto.*;
import com.fitnessapp.progress.rest.api.ProgressApi;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProgressController implements ProgressApi {
    private final ProgressTrackingOperations progressService;
    private final ProgressEnhancementOperations progressEnhancementService;
    private final HttpServletRequest httpServletRequest;

    private Long getCurrentUserId() {
        Object userId = httpServletRequest.getAttribute("userId");
        return userId instanceof Long ? (Long) userId : null;
    }

    @Override
    public ResponseEntity<WeightEntryDTO> logWeight(Object body) {
        Map<String, Object> map = (Map<String, Object>) body;
        Double weight = map.get("weight") != null ? ((Number) map.get("weight")).doubleValue() : null;
        String unit = (String) map.getOrDefault("unit", "kg");
        Double bmi = map.get("bmi") != null ? ((Number) map.get("bmi")).doubleValue() : null;
        Double bodyFat = map.get("bodyFatPercentage") != null ? ((Number) map.get("bodyFatPercentage")).doubleValue() : null;
        String notes = (String) map.get("notes");
        return ResponseEntity.ok(progressService.logWeight(getCurrentUserId(), weight, unit, bmi, bodyFat, notes));
    }

    @Override
    public ResponseEntity<List<WeightEntryDTO>> getWeightEntries(Integer days) {
        return ResponseEntity.ok(progressService.getWeightEntries(getCurrentUserId(), days != null ? days : 90));
    }

    @Override
    public ResponseEntity<BodyMeasurementDTO> logMeasurements(BodyMeasurementDTO dto) {
        return ResponseEntity.ok(progressService.logMeasurements(getCurrentUserId(), dto));
    }

    @Override
    public ResponseEntity<List<BodyMeasurementDTO>> getMeasurements(Integer days) {
        return ResponseEntity.ok(progressService.getMeasurements(getCurrentUserId(), days != null ? days : 90));
    }

    @Override
    public ResponseEntity<ProgressGoalDTO> setGoal(ProgressGoalDTO dto) {
        return ResponseEntity.ok(progressService.setGoal(getCurrentUserId(), dto));
    }

    @Override
    public ResponseEntity<List<ProgressGoalDTO>> getGoals() {
        return ResponseEntity.ok(progressService.getGoals(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<ProgressSummaryDTO> getSummary(String period) {
        return ResponseEntity.ok(progressService.getSummary(getCurrentUserId(), period != null ? period : "monthly"));
    }

    @Override
    public ResponseEntity<TrendDataDTO> getTrends(Integer days) {
        return ResponseEntity.ok(progressService.getTrends(getCurrentUserId(), days != null ? days : 30));
    }

    @Override
    public ResponseEntity<WeeklyReportDTO> getWeeklyReport() {
        return ResponseEntity.ok(progressEnhancementService.getWeeklyReport(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<PlateauAnalysisDTO> getPlateauAnalysis(Integer days) {
        return ResponseEntity.ok(progressEnhancementService.getPlateauAnalysis(getCurrentUserId(), days != null ? days : 30));
    }

    @Override
    public ResponseEntity<AchievementsDTO> getAchievements() {
        return ResponseEntity.ok(progressEnhancementService.getAchievements(getCurrentUserId()));
    }
}
