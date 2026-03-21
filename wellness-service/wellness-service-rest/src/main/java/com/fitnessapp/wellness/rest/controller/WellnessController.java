package com.fitnessapp.wellness.rest.controller;

import com.fitnessapp.wellness.common.dto.*;
import com.fitnessapp.wellness.rest.api.WellnessApi;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WellnessController implements WellnessApi {
    private final WellnessOperations wellnessService;
    private final HttpServletRequest httpServletRequest;

    private Long getCurrentUserId() {
        Object userId = httpServletRequest.getAttribute("userId");
        return userId instanceof Long ? (Long) userId : null;
    }

    @Override
    public ResponseEntity<List<YogaPoseDTO>> getYogaPoses(String difficulty) {
        return ResponseEntity.ok(wellnessService.getYogaPoses(difficulty));
    }

    @Override
    public ResponseEntity<List<MeditationSessionDTO>> getMeditationSessions(String type) {
        return ResponseEntity.ok(wellnessService.getMeditationSessions(type));
    }

    @Override
    public ResponseEntity<List<BreathingExerciseDTO>> getBreathingExercises() {
        return ResponseEntity.ok(wellnessService.getBreathingExercises());
    }

    @Override
    public ResponseEntity<WellnessPlanDTO> generatePlan(Object request) {
        Map<String, Object> map = (Map<String, Object>) request;
        return ResponseEntity.ok(wellnessService.generatePlan(getCurrentUserId(), map));
    }

    @Override
    public ResponseEntity<UserWellnessPlanDTO> assignPlan(Long planId) {
        return ResponseEntity.ok(wellnessService.assignPlan(getCurrentUserId(), planId));
    }

    @Override
    public ResponseEntity<UserWellnessPlanDTO> getMyPlan() {
        UserWellnessPlanDTO plan = wellnessService.getMyPlan(getCurrentUserId());
        return plan != null ? ResponseEntity.ok(plan) : ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<UserWellnessPlanDTO> completeSession(Object body) {
        Map<String, Object> map = (Map<String, Object>) body;
        String sessionType = (String) map.get("sessionType");
        Long sessionId = map.get("sessionId") != null ? ((Number) map.get("sessionId")).longValue() : null;
        Integer duration = map.get("durationMinutes") != null ? ((Number) map.get("durationMinutes")).intValue() : null;
        return ResponseEntity.ok(wellnessService.completeSession(getCurrentUserId(), sessionType, sessionId, duration));
    }

    @Override
    public ResponseEntity<WellnessTipDTO> getDailyTip() {
        return ResponseEntity.ok(wellnessService.getDailyTip());
    }

    @Override
    public ResponseEntity<WellnessStreakDTO> getStreak() {
        return ResponseEntity.ok(wellnessService.getStreak(getCurrentUserId()));
    }

    @Override
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Object>> getTodayCompletions() {
        List<?> result = wellnessService.getTodayCompletions(getCurrentUserId());
        return ResponseEntity.ok((List<Object>) (List<?>) result);
    }
}

