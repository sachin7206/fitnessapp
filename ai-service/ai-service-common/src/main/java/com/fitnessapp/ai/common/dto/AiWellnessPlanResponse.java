package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * AI-generated wellness plan response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiWellnessPlanResponse {
    private List<AiWellnessSession> sessions;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AiWellnessSession {
        private String dayOfWeek;
        private String sessionType;     // YOGA, MEDITATION, BREATHING
        private String sessionName;
        private String description;
        private Integer durationMinutes;
        private Integer caloriesBurned;
        private List<String> poses;     // for yoga
        private List<String> steps;     // for meditation/breathing
    }
}

