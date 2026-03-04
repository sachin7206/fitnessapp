package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiGroceryListResponse {
    private List<GroceryCategory> categories;
    private boolean fromAi;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class GroceryCategory {
        private String categoryName;
        private List<GroceryItem> items;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class GroceryItem {
        private String name;
        private String quantity;
        private String unit;
        private boolean isOptional;
    }
}

