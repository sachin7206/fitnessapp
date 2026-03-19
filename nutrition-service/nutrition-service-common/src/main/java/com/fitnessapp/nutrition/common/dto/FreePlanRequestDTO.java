package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreePlanRequestDTO {
    private String planName;
    private Integer totalCalories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private List<Map<String, Object>> meals;
}


