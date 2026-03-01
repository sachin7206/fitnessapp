package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class MeditationSessionDTO {
    private Long id;
    private String name;
    private String type; // GUIDED, UNGUIDED, SLEEP, FOCUS, STRESS_RELIEF
    private Integer durationMinutes;
    private String description;
    private String audioUrl;
    private String difficulty;
    private String benefits;
}

