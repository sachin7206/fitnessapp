package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class WellnessSessionItemDTO {
    private String dayOfWeek;
    private String sessionType; // YOGA, MEDITATION, BREATHING
    private String sessionName;
    private Integer durationMinutes;
    private String description;
    private Integer caloriesBurned;
}

