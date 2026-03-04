package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AchievementsDTO {
    private List<AchievementItem> achievements;
    private List<StreakItem> streaks;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AchievementItem {
        private String name;
        private String description;
        private String icon;
        private boolean earned;
        private LocalDate earnedAt;
        private double progress;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class StreakItem {
        private String type;
        private int currentCount;
        private int longestCount;
        private LocalDate lastActivityDate;
    }
}

