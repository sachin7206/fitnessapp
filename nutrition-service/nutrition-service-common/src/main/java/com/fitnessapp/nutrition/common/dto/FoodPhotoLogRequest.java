package com.fitnessapp.nutrition.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class FoodPhotoLogRequest {
    @Size(max = 5000000, message = "Image data must be ≤ 5MB")
    private String imageBase64;

    @Size(max = 1000, message = "Description must be ≤ 1000 characters")
    private String description;

    @Pattern(regexp = "^(BREAKFAST|LUNCH|DINNER|SNACK|MORNING_SNACK|AFTERNOON_SNACK|EVENING_SNACK|PRE_WORKOUT|POST_WORKOUT)?$",
             message = "Invalid meal type")
    private String mealType;

    @Pattern(regexp = "^(PHOTO|MANUAL)?$", message = "Source must be PHOTO or MANUAL")
    private String source; // PHOTO or MANUAL
}

