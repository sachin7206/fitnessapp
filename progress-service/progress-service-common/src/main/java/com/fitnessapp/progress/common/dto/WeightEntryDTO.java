package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class WeightEntryDTO {
    private Long id;
    private LocalDate date;
    private Double weight;
    private String unit;
    private Double bmi;
    private Double bodyFatPercentage;
    private String notes;
}

