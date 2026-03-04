package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Request DTO for generating a wellness plan via AI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiWellnessPlanRequest {
    private String type;            // YOGA, MEDITATION, MIXED
    private String level;           // BEGINNER, INTERMEDIATE, ADVANCED
    private Integer durationWeeks;
    private Integer sessionsPerWeek;
    private Integer sessionDurationMinutes;
    private List<String> focusAreas; // e.g., flexibility, stress-relief, strength
}

