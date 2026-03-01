package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class WellnessStreakDTO {
    private Integer currentStreak;
    private Integer longestStreak;
    private Integer totalSessionsCompleted;
    private Integer totalMinutes;
}

