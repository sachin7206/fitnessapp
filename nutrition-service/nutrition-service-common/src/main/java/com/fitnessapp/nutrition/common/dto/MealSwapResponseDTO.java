package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class MealSwapResponseDTO {
    private String originalMeal;
    private List<Object> alternatives;
}

