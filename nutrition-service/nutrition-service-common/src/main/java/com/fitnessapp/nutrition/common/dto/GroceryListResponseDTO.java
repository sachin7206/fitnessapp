package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class GroceryListResponseDTO {
    private String planName;
    private int weekNumber;
    private List<Object> categories;
    private boolean fromAi;
}

