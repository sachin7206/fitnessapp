package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class ProgressGoalDTO {
    private Long id;
    private String goalType; // WEIGHT, BODY_FAT, WAIST, etc.
    private Double targetValue;
    private Double currentValue;
    private Double startValue;
    private LocalDate startDate;
    private LocalDate targetDate;
    private String unit;
    private Boolean isActive;
    private Double progressPercentage;
}

