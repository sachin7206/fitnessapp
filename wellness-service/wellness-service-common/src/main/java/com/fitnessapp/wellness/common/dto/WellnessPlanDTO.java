package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class WellnessPlanDTO {
    private Long id;
    private String planName;
    private String type; // YOGA, MEDITATION, MIXED
    private String level;
    private Integer durationWeeks;
    private Integer sessionsPerWeek;
    private Integer sessionDurationMinutes;
    private String description;
    private List<WellnessSessionItemDTO> sessions;
    private Integer totalCaloriesBurned;
}

