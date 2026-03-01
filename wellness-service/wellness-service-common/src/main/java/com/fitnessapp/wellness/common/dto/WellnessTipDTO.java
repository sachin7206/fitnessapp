package com.fitnessapp.wellness.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class WellnessTipDTO {
    private Long id;
    private String content;
    private String category;
}

