package com.fitnessapp.wellness.impl.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.wellness.common.dto.*;
import com.fitnessapp.wellness.impl.model.*;
import com.fitnessapp.wellness.impl.repository.*;
import com.fitnessapp.wellness.impl.validation.WellnessValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class WellnessService implements WellnessOperations {
    private final YogaPoseRepository poseRepo;
    private final MeditationSessionRepository meditationRepo;
    private final BreathingExerciseRepository breathingRepo;
    private final WellnessPlanRepository planRepo;
    private final UserWellnessPlanRepository userPlanRepo;
    private final SessionCompletionRepository completionRepo;
    private final WellnessTipRepository tipRepo;
    private final ObjectMapper objectMapper;
    private final AiServiceSalClient aiServiceSalClient;
    private final WellnessValidator wellnessValidator;

    @Override
    public List<YogaPoseDTO> getYogaPoses(String difficulty) {
        var poses = difficulty != null ? poseRepo.findByDifficulty(difficulty) : poseRepo.findAll();
        return poses.stream().map(this::toPoseDTO).collect(Collectors.toList());
    }

    @Override
    public List<MeditationSessionDTO> getMeditationSessions(String type) {
        var sessions = type != null ? meditationRepo.findByType(type) : meditationRepo.findAll();
        return sessions.stream().map(this::toMeditationDTO).collect(Collectors.toList());
    }

    @Override
    public List<BreathingExerciseDTO> getBreathingExercises() {
        return breathingRepo.findAll().stream().map(this::toBreathingDTO).collect(Collectors.toList());
    }

    @Override @Transactional
    public WellnessPlanDTO generatePlan(Long userId, Map<String, Object> request) {
        String type = (String) request.getOrDefault("type", "MIXED");
        String level = (String) request.getOrDefault("level", "BEGINNER");
        int durationWeeks = request.get("durationWeeks") != null ? ((Number) request.get("durationWeeks")).intValue() : 4;
        int sessionsPerWeek = request.get("sessionsPerWeek") != null ? ((Number) request.get("sessionsPerWeek")).intValue() : 5;
        int sessionDuration = request.get("sessionDurationMinutes") != null ? ((Number) request.get("sessionDurationMinutes")).intValue() : 30;

        List<WellnessSessionItemDTO> sessions = null;

        // Try AI service first
        if (aiServiceSalClient.isAvailable()) {
            try {
                AiWellnessPlanRequest aiRequest = new AiWellnessPlanRequest(
                    type, level, durationWeeks, sessionsPerWeek, sessionDuration, null);
                AiWellnessPlanResponse aiResponse = aiServiceSalClient.generateWellnessPlan(aiRequest);
                if (aiResponse != null && aiResponse.getSessions() != null && !aiResponse.getSessions().isEmpty()) {
                    sessions = convertAiSessions(aiResponse.getSessions(), sessionDuration);
                    log.info("AI-generated wellness plan for userId: {}", userId);
                }
            } catch (Exception e) {
                log.warn("AI wellness plan generation failed, using fallback: {}", e.getMessage());
            }
        }

        // Fallback to pre-built plan
        if (sessions == null || sessions.isEmpty()) {
            sessions = buildFallbackSessions(type, level, sessionsPerWeek, sessionDuration);
        }

        int totalCalories = sessions.stream().mapToInt(s -> s.getCaloriesBurned() != null ? s.getCaloriesBurned() : 0).sum() * durationWeeks;

        WellnessPlan plan = new WellnessPlan();
        plan.setPlanName(String.format("Personalized %s Plan (%s)", formatLabel(type), formatLabel(level)));
        plan.setType(type);
        plan.setLevel(level);
        plan.setDurationWeeks(durationWeeks);
        plan.setSessionsPerWeek(sessionsPerWeek);
        plan.setSessionDurationMinutes(sessionDuration);
        plan.setDescription(String.format("A %d-week %s wellness plan at %s level", durationWeeks, type.toLowerCase(), level.toLowerCase()));
        plan.setTotalCaloriesBurned(totalCalories);

        try {
            plan.setSessionsJson(objectMapper.writeValueAsString(sessions));
        } catch (Exception e) {
            plan.setSessionsJson("[]");
        }

        WellnessPlan saved = planRepo.save(plan);
        WellnessPlanDTO dto = toPlanDTO(saved);
        dto.setSessions(sessions);
        return dto;
    }

    /** Convert AI-generated sessions to DTOs */
    private List<WellnessSessionItemDTO> convertAiSessions(List<AiWellnessPlanResponse.AiWellnessSession> aiSessions, int duration) {
        List<WellnessSessionItemDTO> sessions = new ArrayList<>();
        for (AiWellnessPlanResponse.AiWellnessSession as : aiSessions) {
            WellnessSessionItemDTO s = new WellnessSessionItemDTO();
            s.setDayOfWeek(as.getDayOfWeek());
            s.setSessionType(as.getSessionType());
            s.setSessionName(as.getSessionName());
            s.setDescription(as.getDescription());
            s.setDurationMinutes(as.getDurationMinutes() != null ? as.getDurationMinutes() : duration);
            s.setCaloriesBurned(as.getCaloriesBurned() != null ? as.getCaloriesBurned() : duration * 3);
            sessions.add(s);
        }
        return sessions;
    }

    private List<WellnessSessionItemDTO> buildFallbackSessions(String type, String level, int sessionsPerWeek, int duration) {
        String[] days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"};
        List<WellnessSessionItemDTO> sessions = new ArrayList<>();

        for (int i = 0; i < Math.min(sessionsPerWeek, 7); i++) {
            WellnessSessionItemDTO s = new WellnessSessionItemDTO();
            s.setDayOfWeek(days[i]);
            s.setDurationMinutes(duration);

            switch (type) {
                case "YOGA":
                    s.setSessionType("YOGA");
                    s.setSessionName(getYogaSessionName(i, level));
                    s.setDescription(getYogaDescription(i, level));
                    s.setCaloriesBurned(duration * 4);
                    break;
                case "MEDITATION":
                    s.setSessionType("MEDITATION");
                    s.setSessionName(getMeditationSessionName(i));
                    s.setDescription(getMeditationDescription(i));
                    s.setCaloriesBurned(duration * 1);
                    break;
                default: // MIXED
                    if (i % 3 == 0) {
                        s.setSessionType("BREATHING");
                        s.setSessionName(getBreathingName(i));
                        s.setDescription("Pranayama and breathing practice");
                        s.setCaloriesBurned(duration * 1);
                    } else if (i % 3 == 1) {
                        s.setSessionType("MEDITATION");
                        s.setSessionName(getMeditationSessionName(i));
                        s.setDescription(getMeditationDescription(i));
                        s.setCaloriesBurned(duration * 1);
                    } else {
                        s.setSessionType("YOGA");
                        s.setSessionName(getYogaSessionName(i, level));
                        s.setDescription(getYogaDescription(i, level));
                        s.setCaloriesBurned(duration * 4);
                    }
                    break;
            }
            sessions.add(s);
        }
        return sessions;
    }

    private String getYogaSessionName(int idx, String level) {
        String[][] names = {
            {"Sun Salutation Flow", "Gentle Morning Yoga", "Foundation Poses"},
            {"Vinyasa Flow", "Power Yoga Basics", "Warrior Sequence"},
            {"Advanced Ashtanga", "Inversions Practice", "Hot Yoga Flow"}
        };
        int lvl = "ADVANCED".equals(level) ? 2 : "INTERMEDIATE".equals(level) ? 1 : 0;
        return names[lvl][idx % 3];
    }

    private String getYogaDescription(int idx, String level) {
        return "BEGINNER".equals(level) ? "Gentle poses focusing on flexibility and breathing" :
               "INTERMEDIATE".equals(level) ? "Moderate flow with balance and strength poses" :
               "Challenging sequences with advanced transitions";
    }

    private String getMeditationSessionName(int idx) {
        String[] names = {"Mindful Breathing", "Body Scan Meditation", "Guided Visualization", "Loving Kindness", "Stress Relief Focus", "Deep Sleep Prep", "Morning Mindfulness"};
        return names[idx % names.length];
    }

    private String getMeditationDescription(int idx) {
        return "A guided meditation session for inner peace and clarity";
    }

    private String getBreathingName(int idx) {
        String[] names = {"Pranayama Practice", "Box Breathing", "4-7-8 Relaxation", "Kapalbhati", "Anulom Vilom"};
        return names[idx % names.length];
    }

    @Override @Transactional
    public UserWellnessPlanDTO assignPlan(Long userId, Long planId) {
        WellnessPlan plan = wellnessValidator.validatePlanExists(planId);
        boolean hasActive = userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE").isPresent();
        LocalDate startDate;

        if (hasActive) {
            userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE").ifPresent(old -> { old.setStatus("ENDING_TODAY"); old.setEndDate(LocalDate.now()); userPlanRepo.save(old); });
            userPlanRepo.findByUserIdAndStatus(userId, "SCHEDULED").ifPresent(s -> { s.setStatus("CANCELLED"); userPlanRepo.save(s); });
            startDate = LocalDate.now().plusDays(1);
        } else {
            userPlanRepo.findByUserIdAndStatus(userId, "SCHEDULED").ifPresent(s -> { s.setStatus("CANCELLED"); userPlanRepo.save(s); });
            startDate = LocalDate.now();
        }

        UserWellnessPlan up = new UserWellnessPlan();
        up.setUserId(userId);
        up.setWellnessPlan(plan);
        up.setStartDate(startDate);
        up.setEndDate(startDate.plusWeeks(plan.getDurationWeeks() != null ? plan.getDurationWeeks() : 4));
        up.setStatus(startDate.isAfter(LocalDate.now()) ? "SCHEDULED" : "ACTIVE");
        up.setCompletedSessions(0);
        up.setTotalSessions((plan.getSessionsPerWeek() != null ? plan.getSessionsPerWeek() : 5) * (plan.getDurationWeeks() != null ? plan.getDurationWeeks() : 4));

        UserWellnessPlanDTO dto = toUserPlanDTO(userPlanRepo.save(up));
        dto.setScheduledForTomorrow(startDate.isAfter(LocalDate.now()));
        return dto;
    }

    @Override @Transactional
    public UserWellnessPlanDTO getMyPlan(Long userId) {
        LocalDate today = LocalDate.now();
        // Promote SCHEDULED, complete ENDING_TODAY
        userPlanRepo.findByUserIdAndStatus(userId, "ENDING_TODAY").ifPresent(e -> {
            if (e.getEndDate() != null && e.getEndDate().isBefore(today)) { e.setStatus("COMPLETED"); userPlanRepo.save(e); }
        });
        userPlanRepo.findByUserIdAndStatus(userId, "SCHEDULED").ifPresent(s -> {
            if (!s.getStartDate().isAfter(today)) { s.setStatus("ACTIVE"); userPlanRepo.save(s); }
        });
        var ending = userPlanRepo.findByUserIdAndStatus(userId, "ENDING_TODAY");
        if (ending.isPresent()) return toUserPlanDTO(ending.get());
        return userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE").map(this::toUserPlanDTO).orElse(null);
    }

    @Override @Transactional
    public UserWellnessPlanDTO completeSession(Long userId, String sessionType, Long sessionId, Integer durationMinutes) {
        SessionCompletion sc = new SessionCompletion();
        sc.setUserId(userId);
        sc.setSessionType(sessionType);
        sc.setSessionId(sessionId);
        sc.setDurationMinutes(durationMinutes);
        completionRepo.save(sc);

        var plan = userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE");
        if (plan.isPresent()) {
            plan.get().setCompletedSessions((plan.get().getCompletedSessions() != null ? plan.get().getCompletedSessions() : 0) + 1);
            return toUserPlanDTO(userPlanRepo.save(plan.get()));
        }
        return null;
    }

    @Override
    public WellnessTipDTO getDailyTip() {
        int dayOfYear = LocalDate.now().getDayOfYear();
        long totalTips = tipRepo.count();
        if (totalTips == 0) return new WellnessTipDTO(0L, "Take a deep breath and smile. You're doing great! 🧘", "GENERAL");
        int dayNum = (int) ((dayOfYear % totalTips) + 1);
        return tipRepo.findByDayNumber(dayNum)
                .map(t -> new WellnessTipDTO(t.getId(), t.getContent(), t.getCategory()))
                .orElse(new WellnessTipDTO(0L, "Practice mindfulness for 5 minutes today. 🕊️", "MINDFULNESS"));
    }

    @Override
    public WellnessStreakDTO getStreak(Long userId) {
        var completions = completionRepo.findByUserIdOrderByCompletedDateDesc(userId);
        int current = 0, longest = 0;
        LocalDate date = LocalDate.now();
        Set<LocalDate> dates = completions.stream().map(SessionCompletion::getCompletedDate).collect(Collectors.toSet());
        while (dates.contains(date)) { current++; date = date.minusDays(1); }
        // Calculate longest (simplified)
        longest = Math.max(current, 0);
        int totalMins = completions.stream().mapToInt(c -> c.getDurationMinutes() != null ? c.getDurationMinutes() : 0).sum();
        return new WellnessStreakDTO(current, longest, (int) completionRepo.countByUserId(userId), totalMins);
    }

    @Override
    public List<Map<String, Object>> getTodayCompletions(Long userId) {
        var completions = completionRepo.findByUserIdAndCompletedDate(userId, LocalDate.now());
        return completions.stream().map(c -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("sessionType", c.getSessionType());
            m.put("sessionId", c.getSessionId());
            m.put("durationMinutes", c.getDurationMinutes());
            return m;
        }).collect(Collectors.toList());
    }

    private String formatLabel(String s) { return s == null ? "" : s.replace("_", " ").substring(0, 1) + s.replace("_", " ").substring(1).toLowerCase(); }

    private YogaPoseDTO toPoseDTO(YogaPose p) {
        return new YogaPoseDTO(p.getId(), p.getName(), p.getSanskritName(), p.getDescription(), p.getBenefits(), p.getDifficulty(), p.getDurationSeconds(), p.getImageUrl(), p.getCategory(), p.getInstructions());
    }
    private MeditationSessionDTO toMeditationDTO(MeditationSession m) {
        return new MeditationSessionDTO(m.getId(), m.getName(), m.getType(), m.getDurationMinutes(), m.getDescription(), m.getAudioUrl(), m.getDifficulty(), m.getBenefits());
    }
    private BreathingExerciseDTO toBreathingDTO(BreathingExercise b) {
        return new BreathingExerciseDTO(b.getId(), b.getName(), b.getTechnique(), b.getPattern(), b.getDurationMinutes(), b.getDescription(), b.getBenefits(), b.getDifficulty());
    }
    private WellnessPlanDTO toPlanDTO(WellnessPlan p) {
        WellnessPlanDTO d = new WellnessPlanDTO();
        d.setId(p.getId()); d.setPlanName(p.getPlanName()); d.setType(p.getType()); d.setLevel(p.getLevel());
        d.setDurationWeeks(p.getDurationWeeks()); d.setSessionsPerWeek(p.getSessionsPerWeek());
        d.setSessionDurationMinutes(p.getSessionDurationMinutes()); d.setDescription(p.getDescription());
        d.setTotalCaloriesBurned(p.getTotalCaloriesBurned());
        try { d.setSessions(objectMapper.readValue(p.getSessionsJson(), new TypeReference<>() {})); } catch (Exception e) { d.setSessions(List.of()); }
        return d;
    }
    private UserWellnessPlanDTO toUserPlanDTO(UserWellnessPlan up) {
        return new UserWellnessPlanDTO(up.getId(), up.getUserId(), toPlanDTO(up.getWellnessPlan()),
                up.getStartDate(), up.getEndDate(), up.getStatus(), up.getCompletedSessions(), up.getTotalSessions(), false);
    }
}

