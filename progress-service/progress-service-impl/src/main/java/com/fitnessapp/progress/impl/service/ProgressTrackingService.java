package com.fitnessapp.progress.impl.service;

import com.fitnessapp.progress.common.dto.*;
import com.fitnessapp.progress.impl.model.*;
import com.fitnessapp.progress.impl.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class ProgressTrackingService implements ProgressTrackingOperations {
    private final DailyProgressRepository progressRepo;
    private final BodyMeasurementRepository measurementRepo;
    private final ProgressGoalRepository goalRepo;

    @Override @Transactional
    public WeightEntryDTO logWeight(Long userId, Double weight, String unit, Double bmi, Double bodyFatPct, String notes) {
        LocalDate today = LocalDate.now();
        DailyProgress entry = progressRepo.findByUserIdAndEntryDate(userId, today)
                .orElseGet(() -> { DailyProgress p = new DailyProgress(); p.setUserId(userId); p.setEntryDate(today); return p; });
        entry.setWeight(weight);
        entry.setWeightUnit(unit != null ? unit : "kg");
        entry.setBmi(bmi);
        entry.setBodyFatPercentage(bodyFatPct);
        entry.setNotes(notes);
        DailyProgress saved = progressRepo.save(entry);

        // Update weight goals
        goalRepo.findByUserIdAndGoalTypeAndIsActiveTrue(userId, "WEIGHT").forEach(g -> {
            g.setCurrentValue(weight);
            goalRepo.save(g);
        });

        return toWeightDTO(saved);
    }

    @Override
    public List<WeightEntryDTO> getWeightEntries(Long userId, int days) {
        return progressRepo.findByUserIdAndEntryDateAfterOrderByEntryDateDesc(userId, LocalDate.now().minusDays(days))
                .stream().map(this::toWeightDTO).collect(Collectors.toList());
    }

    @Override @Transactional
    public BodyMeasurementDTO logMeasurements(Long userId, BodyMeasurementDTO dto) {
        BodyMeasurement m = new BodyMeasurement();
        m.setUserId(userId);
        m.setMeasurementDate(LocalDate.now());
        m.setChest(dto.getChest()); m.setWaist(dto.getWaist()); m.setHips(dto.getHips());
        m.setLeftArm(dto.getLeftArm()); m.setRightArm(dto.getRightArm());
        m.setLeftThigh(dto.getLeftThigh()); m.setRightThigh(dto.getRightThigh());
        m.setNeck(dto.getNeck());
        m.setUnit(dto.getUnit() != null ? dto.getUnit() : "cm");
        return toMeasurementDTO(measurementRepo.save(m));
    }

    @Override
    public List<BodyMeasurementDTO> getMeasurements(Long userId, int days) {
        return measurementRepo.findByUserIdAndMeasurementDateAfterOrderByMeasurementDateDesc(userId, LocalDate.now().minusDays(days))
                .stream().map(this::toMeasurementDTO).collect(Collectors.toList());
    }

    @Override @Transactional
    public ProgressGoalDTO setGoal(Long userId, ProgressGoalDTO dto) {
        // Deactivate existing goals of same type
        goalRepo.findByUserIdAndGoalTypeAndIsActiveTrue(userId, dto.getGoalType()).forEach(g -> {
            g.setIsActive(false);
            goalRepo.save(g);
        });
        ProgressGoal goal = new ProgressGoal();
        goal.setUserId(userId);
        goal.setGoalType(dto.getGoalType());
        goal.setTargetValue(dto.getTargetValue());
        goal.setCurrentValue(dto.getCurrentValue());
        goal.setStartValue(dto.getCurrentValue());
        goal.setStartDate(LocalDate.now());
        goal.setTargetDate(dto.getTargetDate());
        goal.setUnit(dto.getUnit());
        goal.setIsActive(true);
        return toGoalDTO(goalRepo.save(goal));
    }

    @Override
    public List<ProgressGoalDTO> getGoals(Long userId) {
        return goalRepo.findByUserIdAndIsActiveTrue(userId).stream().map(this::toGoalDTO).collect(Collectors.toList());
    }

    @Override
    public ProgressSummaryDTO getSummary(Long userId, String period) {
        int days = "weekly".equalsIgnoreCase(period) ? 7 : 30;
        List<DailyProgress> entries = progressRepo.findByUserIdAndEntryDateAfterOrderByEntryDateDesc(userId, LocalDate.now().minusDays(days));
        DailyProgress latest = entries.isEmpty() ? null : entries.get(0);
        DailyProgress oldest = entries.isEmpty() ? null : entries.get(entries.size() - 1);
        double weightChange = (latest != null && oldest != null && latest.getWeight() != null && oldest.getWeight() != null)
                ? latest.getWeight() - oldest.getWeight() : 0;

        ProgressSummaryDTO summary = new ProgressSummaryDTO();
        summary.setPeriod(period);
        summary.setCurrentWeight(latest != null ? latest.getWeight() : null);
        summary.setWeightChange(weightChange);
        summary.setBmi(latest != null ? latest.getBmi() : null);
        summary.setActiveGoals(getGoals(userId));
        summary.setLatestMeasurements(measurementRepo.findTopByUserIdOrderByMeasurementDateDesc(userId).map(this::toMeasurementDTO).orElse(null));
        summary.setTotalEntriesLogged((int) progressRepo.countByUserIdAndEntryDateAfter(userId, LocalDate.now().minusDays(days)));
        summary.setStreakDays(calculateStreak(userId));
        return summary;
    }

    @Override
    public TrendDataDTO getTrends(Long userId, int days) {
        List<DailyProgress> entries = progressRepo.findByUserIdAndEntryDateAfterOrderByEntryDateDesc(userId, LocalDate.now().minusDays(days));
        TrendDataDTO trend = new TrendDataDTO();
        trend.setWeightTrend(entries.stream().filter(e -> e.getWeight() != null)
                .map(e -> new TrendDataDTO.TrendPoint(e.getEntryDate(), e.getWeight())).collect(Collectors.toList()));
        trend.setBmiTrend(entries.stream().filter(e -> e.getBmi() != null)
                .map(e -> new TrendDataDTO.TrendPoint(e.getEntryDate(), e.getBmi())).collect(Collectors.toList()));
        return trend;
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

    private WeightEntryDTO toWeightDTO(DailyProgress p) {
        return new WeightEntryDTO(p.getId(), p.getEntryDate(), p.getWeight(), p.getWeightUnit(), p.getBmi(), p.getBodyFatPercentage(), p.getNotes());
    }

    private BodyMeasurementDTO toMeasurementDTO(BodyMeasurement m) {
        return new BodyMeasurementDTO(m.getId(), m.getMeasurementDate(), m.getChest(), m.getWaist(), m.getHips(),
                m.getLeftArm(), m.getRightArm(), m.getLeftThigh(), m.getRightThigh(), m.getNeck(), m.getUnit());
    }

    private ProgressGoalDTO toGoalDTO(ProgressGoal g) {
        double progress = 0;
        if (g.getStartValue() != null && g.getTargetValue() != null && g.getCurrentValue() != null) {
            double total = Math.abs(g.getTargetValue() - g.getStartValue());
            double done = Math.abs(g.getCurrentValue() - g.getStartValue());
            progress = total > 0 ? Math.min(100, (done / total) * 100) : 0;
        }
        return new ProgressGoalDTO(g.getId(), g.getGoalType(), g.getTargetValue(), g.getCurrentValue(), g.getStartValue(),
                g.getStartDate(), g.getTargetDate(), g.getUnit(), g.getIsActive(), progress);
    }
}
