package com.fitnessapp.wellness.rest.controller;

import com.fitnessapp.wellness.common.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wellness")
@RequiredArgsConstructor
public class WellnessController {
    private final WellnessOperations wellnessService;

    private String getCurrentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/yoga/poses")
    public ResponseEntity<List<YogaPoseDTO>> getYogaPoses(@RequestParam(required = false) String difficulty) {
        return ResponseEntity.ok(wellnessService.getYogaPoses(difficulty));
    }

    @GetMapping("/meditation/sessions")
    public ResponseEntity<List<MeditationSessionDTO>> getMeditationSessions(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(wellnessService.getMeditationSessions(type));
    }

    @GetMapping("/breathing/exercises")
    public ResponseEntity<List<BreathingExerciseDTO>> getBreathingExercises() {
        return ResponseEntity.ok(wellnessService.getBreathingExercises());
    }

    @PostMapping("/generate-plan")
    public ResponseEntity<WellnessPlanDTO> generatePlan(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(wellnessService.generatePlan(getCurrentEmail(), request));
    }

    @PostMapping("/plans/{planId}/assign")
    public ResponseEntity<UserWellnessPlanDTO> assignPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(wellnessService.assignPlan(getCurrentEmail(), planId));
    }

    @GetMapping("/my-plan")
    public ResponseEntity<UserWellnessPlanDTO> getMyPlan() {
        UserWellnessPlanDTO plan = wellnessService.getMyPlan(getCurrentEmail());
        return plan != null ? ResponseEntity.ok(plan) : ResponseEntity.noContent().build();
    }

    @PostMapping("/my-plan/complete-session")
    public ResponseEntity<UserWellnessPlanDTO> completeSession(@RequestBody Map<String, Object> body) {
        String sessionType = (String) body.get("sessionType");
        Long sessionId = body.get("sessionId") != null ? ((Number) body.get("sessionId")).longValue() : null;
        Integer duration = body.get("durationMinutes") != null ? ((Number) body.get("durationMinutes")).intValue() : null;
        return ResponseEntity.ok(wellnessService.completeSession(getCurrentEmail(), sessionType, sessionId, duration));
    }

    @GetMapping("/tips/daily")
    public ResponseEntity<WellnessTipDTO> getDailyTip() {
        return ResponseEntity.ok(wellnessService.getDailyTip());
    }

    @GetMapping("/streak")
    public ResponseEntity<WellnessStreakDTO> getStreak() {
        return ResponseEntity.ok(wellnessService.getStreak(getCurrentEmail()));
    }

    @GetMapping("/completions/today")
    public ResponseEntity<List<Map<String, Object>>> getTodayCompletions() {
        return ResponseEntity.ok(wellnessService.getTodayCompletions(getCurrentEmail()));
    }
}

