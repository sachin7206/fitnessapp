package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class BodyMeasurementDTO {
    private Long id;
    private LocalDate date;
    private Double chest;
    private Double waist;
    private Double hips;
    private Double leftArm;
    private Double rightArm;
    private Double leftThigh;
    private Double rightThigh;
    private Double neck;
    private String unit;
}

