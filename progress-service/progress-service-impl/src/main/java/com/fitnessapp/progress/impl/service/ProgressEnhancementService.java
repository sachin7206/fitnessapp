package com.fitnessapp.progress.impl.service;

import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.progress.common.dto.*;
import com.fitnessapp.progress.impl.model.DailyProgress;
import com.fitnessapp.progress.impl.repository.DailyProgressRepository;
import com.fitnessapp.progress.impl.repository.ProgressGoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressEnhancementService implements ProgressEnhancementOperations {

    private final AiServiceSalClient aiSalClient;
    private final DailyProgressRepository progressRepo;
    private final ProgressGoalRepository goalRepo;

    public WeeklyReportDTO getWeeklyReport(Long userId) {
        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        List<DailyProgress> weekEntries = progressRepo.findByUserIdAndEntryDateAfterOrderByEntryDateDesc(
                userId, weekStart.minusDays(1));

        try {
            AiWeeklyReportRequest aiRequest = new AiWeeklyReportRequest();
            aiRequest.setUserName("User-" + userId);
            aiRequest.setWeekStartDate(weekStart.toString());

            // Build weight entries
            List<Object> weights = weekEntries.stream()
                    .filter(e -> e.getWeight() != null)
                    .map(e -> {
                        Map<String, Object> w = new HashMap<>();
                        w.put("date", e.getEntryDate().toString());
                        w.put("weight", e.getWeight());
                        return (Object) w;
                    }).collect(Collectors.toList());
            aiRequest.setWeightEntries(weights);

            // Goals
            List<String> goals = goalRepo.findByUserIdAndIsActiveTrue(userId).stream()
                    .map(g -> g.getGoalType() + ": " + g.getTargetValue()).collect(Collectors.toList());
            aiRequest.setGoals(goals);
            aiRequest.setWorkoutCompletions(0);
            aiRequest.setTotalWorkoutsPlanned(5);
            aiRequest.setMealAdherencePercent(70.0);
            aiRequest.setTotalSteps(0);

            AiWeeklyReportResponse aiResponse = aiSalClient.generateWeeklyReport(aiRequest);

            WeeklyReportDTO report = new WeeklyReportDTO();
            report.setSummary(aiResponse.getSummary());
            report.setHighlights(aiResponse.getHighlights());
            report.setConcerns(aiResponse.getConcerns());
            report.setRecommendations(aiResponse.getRecommendations());
            report.setOverallScore(aiResponse.getOverallScore());
            report.setFromAi(aiResponse.isFromAi());
            report.setWeekStartDate(weekStart);
            return report;
        } catch (Exception e) {
            log.warn("AI weekly report failed: {}", e.getMessage());
            return getFallbackWeeklyReport(weekStart);
        }
    }

    private WeeklyReportDTO getFallbackWeeklyReport(LocalDate weekStart) {
        WeeklyReportDTO fallback = new WeeklyReportDTO();
        fallback.setSummary("Keep pushing towards your goals! Track your progress daily for better insights.");
        fallback.setHighlights(List.of("You are tracking your progress consistently"));
        fallback.setConcerns(List.of("Log more data points for better analysis"));
        fallback.setRecommendations(List.of(
                "Stay consistent with your workout schedule",
                "Drink at least 8 glasses of water daily",
                "Get 7-8 hours of sleep for optimal recovery"
        ));
        fallback.setOverallScore(60);
        fallback.setFromAi(false);
        fallback.setWeekStartDate(weekStart);
        return fallback;
    }

    public PlateauAnalysisDTO getPlateauAnalysis(Long userId, int days) {
        List<DailyProgress> entries = progressRepo.findByUserIdAndEntryDateAfterOrderByEntryDateDesc(
                userId, LocalDate.now().minusDays(days));

        try {
            AiPlateauDetectionRequest aiRequest = new AiPlateauDetectionRequest();
            List<Object> weights = entries.stream()
                    .filter(e -> e.getWeight() != null)
                    .map(e -> {
                        Map<String, Object> w = new HashMap<>();
                        w.put("date", e.getEntryDate().toString());
                        w.put("weight", e.getWeight());
                        return (Object) w;
                    }).collect(Collectors.toList());
            aiRequest.setWeightHistory(weights);
            aiRequest.setDaysAnalyzed(days);

            List<String> goals = goalRepo.findByUserIdAndIsActiveTrue(userId).stream()
                    .map(g -> g.getGoalType()).collect(Collectors.toList());
            aiRequest.setCurrentGoal(goals.isEmpty() ? "GENERAL_FITNESS" : goals.get(0));

            AiPlateauDetectionResponse aiResponse = aiSalClient.detectPlateau(aiRequest);

            PlateauAnalysisDTO result = new PlateauAnalysisDTO();
            result.setPlateauDetected(aiResponse.isPlateauDetected());
            result.setPlateauType(aiResponse.getPlateauType());
            result.setDurationWeeks(aiResponse.getDurationWeeks());
            result.setAnalysis(aiResponse.getAnalysis());
            result.setSuggestions(aiResponse.getSuggestions());
            result.setFromAi(aiResponse.isFromAi());
            return result;
        } catch (Exception e) {
            log.warn("AI plateau detection failed: {}", e.getMessage());
            PlateauAnalysisDTO fallback = new PlateauAnalysisDTO();
            fallback.setPlateauDetected(false);
            fallback.setPlateauType("NONE");
            fallback.setAnalysis("Not enough data for analysis. Continue logging your progress.");
            fallback.setSuggestions(List.of("Vary your workout intensity", "Try new exercises"));
            fallback.setFromAi(false);
            return fallback;
        }
    }

    public AchievementsDTO getAchievements(Long userId) {
        List<DailyProgress> entries = progressRepo.findByUserIdAndEntryDateAfterOrderByEntryDateDesc(
                userId, LocalDate.now().minusDays(365));
        int streak = calculateStreak(userId);

        List<AchievementsDTO.AchievementItem> achievements = new ArrayList<>();
        // First Log
        achievements.add(new AchievementsDTO.AchievementItem("First Step", "Logged your first progress entry", "🏁",
                !entries.isEmpty(), entries.isEmpty() ? null : entries.get(entries.size() - 1).getEntryDate(), entries.isEmpty() ? 0 : 100));
        // Week Warrior
        achievements.add(new AchievementsDTO.AchievementItem("Week Warrior", "Logged progress for 7 consecutive days", "🔥",
                streak >= 7, streak >= 7 ? LocalDate.now() : null, Math.min(100, (streak / 7.0) * 100)));
        // Month Master
        achievements.add(new AchievementsDTO.AchievementItem("Month Master", "Logged progress for 30 consecutive days", "👑",
                streak >= 30, streak >= 30 ? LocalDate.now() : null, Math.min(100, (streak / 30.0) * 100)));
        // Data Driven
        achievements.add(new AchievementsDTO.AchievementItem("Data Driven", "Logged 50 progress entries", "📊",
                entries.size() >= 50, entries.size() >= 50 ? LocalDate.now() : null, Math.min(100, (entries.size() / 50.0) * 100)));
        // Goal Setter
        long activeGoals = goalRepo.findByUserIdAndIsActiveTrue(userId).size();
        achievements.add(new AchievementsDTO.AchievementItem("Goal Setter", "Set your first fitness goal", "🎯",
                activeGoals > 0, activeGoals > 0 ? LocalDate.now() : null, activeGoals > 0 ? 100 : 0));

        List<AchievementsDTO.StreakItem> streaks = new ArrayList<>();
        streaks.add(new AchievementsDTO.StreakItem("LOGGING", streak, streak, streak > 0 ? LocalDate.now() : null));

        return new AchievementsDTO(achievements, streaks);
    }

    private int calculateStreak(Long userId) {
        int streak = 0;
        LocalDate date = LocalDate.now();
        while (progressRepo.findByUserIdAndEntryDate(userId, date).isPresent()) {
            streak++;
            date = date.minusDays(1);
        }
        return streak;
    }
}

