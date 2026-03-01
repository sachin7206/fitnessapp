package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class BreathingExerciseDTO {
    private Long id;
    private String name;
    private String technique;
    private String pattern; // e.g. "4-7-8", "box: 4-4-4-4"
    private Integer durationMinutes;
    private String description;
    private String benefits;
    private String difficulty;
}

