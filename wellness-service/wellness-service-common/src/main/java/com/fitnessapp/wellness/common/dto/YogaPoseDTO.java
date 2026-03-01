package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class YogaPoseDTO {
    private Long id;
    private String name;
    private String sanskritName;
    private String description;
    private String benefits;
    private String difficulty;
    private Integer durationSeconds;
    private String imageUrl;
    private String category;
    private String instructions;
}

