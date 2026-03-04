package com.fitnessapp.nutrition.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class FoodPhotoLogRequest {
    private String imageBase64;
    private String description;
    private String mealType;
    private String source; // PHOTO or MANUAL
}

