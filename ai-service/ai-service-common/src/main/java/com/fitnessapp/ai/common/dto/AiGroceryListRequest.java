package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiGroceryListRequest {
    private List<Object> meals;
    private int daysCount = 7;
    private String region;
}

