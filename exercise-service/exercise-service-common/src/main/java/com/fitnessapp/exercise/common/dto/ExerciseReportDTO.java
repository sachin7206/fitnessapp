package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseReportDTO {
    private String startDate;
    private String endDate;
    private int totalWorkoutDays;       // from workout_completions table
    private int totalExercisesLogged;   // total individual exercise log entries
    private double totalVolumeLifted;   // sum of all sets * reps * weight
    private Map<String, Integer> exerciseFrequency; // exerciseName -> count
    private List<PersonalBest> personalBests;
    private List<DailyVolume> volumeProgression;
    private List<ExerciseHistory> exerciseHistories; // per-exercise edit history

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalBest {
        private String exerciseName;
        private double bestWeight;
        private String date;
        private int reps;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyVolume {
        private String date;
        private double totalVolume; // sum of sets * reps * weight
        private int exerciseCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExerciseHistory {
        private String exerciseName;
        private int totalEdits;
        private double avgWeight;
        private double avgReps;
        private double maxWeight;
        private int maxReps;
        private List<EditEntry> edits;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EditEntry {
        private String loggedAt;
        private List<SetDetail> sets;
        private double totalVolume;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SetDetail {
        private int reps;
        private double weight;
    }
}

