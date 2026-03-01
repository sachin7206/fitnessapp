package com.fitnessapp.progress.rest.controller;

import com.fitnessapp.progress.common.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {
    private final ProgressTrackingOperations progressService;

    private String getCurrentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping("/weight")
    public ResponseEntity<WeightEntryDTO> logWeight(@RequestBody Map<String, Object> body) {
        Double weight = body.get("weight") != null ? ((Number) body.get("weight")).doubleValue() : null;
        String unit = (String) body.getOrDefault("unit", "kg");
        Double bmi = body.get("bmi") != null ? ((Number) body.get("bmi")).doubleValue() : null;
        Double bodyFat = body.get("bodyFatPercentage") != null ? ((Number) body.get("bodyFatPercentage")).doubleValue() : null;
        String notes = (String) body.get("notes");
        return ResponseEntity.ok(progressService.logWeight(getCurrentEmail(), weight, unit, bmi, bodyFat, notes));
    }

    @GetMapping("/weight")
    public ResponseEntity<List<WeightEntryDTO>> getWeightEntries(@RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(progressService.getWeightEntries(getCurrentEmail(), days));
    }

    @PostMapping("/measurements")
    public ResponseEntity<BodyMeasurementDTO> logMeasurements(@RequestBody BodyMeasurementDTO dto) {
        return ResponseEntity.ok(progressService.logMeasurements(getCurrentEmail(), dto));
    }

    @GetMapping("/measurements")
    public ResponseEntity<List<BodyMeasurementDTO>> getMeasurements(@RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(progressService.getMeasurements(getCurrentEmail(), days));
    }

    @PostMapping("/goals")
    public ResponseEntity<ProgressGoalDTO> setGoal(@RequestBody ProgressGoalDTO dto) {
        return ResponseEntity.ok(progressService.setGoal(getCurrentEmail(), dto));
    }

    @GetMapping("/goals")
    public ResponseEntity<List<ProgressGoalDTO>> getGoals() {
        return ResponseEntity.ok(progressService.getGoals(getCurrentEmail()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ProgressSummaryDTO> getSummary(@RequestParam(defaultValue = "monthly") String period) {
        return ResponseEntity.ok(progressService.getSummary(getCurrentEmail(), period));
    }

    @GetMapping("/trends")
    public ResponseEntity<TrendDataDTO> getTrends(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(progressService.getTrends(getCurrentEmail(), days));
    }
}

