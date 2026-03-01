package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class UserWellnessPlanDTO {
    private Long id;
    private String userEmail;
    private WellnessPlanDTO wellnessPlan;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer completedSessions;
    private Integer totalSessions;
    private Boolean scheduledForTomorrow;
}

