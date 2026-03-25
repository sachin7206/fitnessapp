package com.fitnessapp.exercise.common.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomWorkoutPlanRequest {
    @NotBlank(message = "Plan name is required")
    @Size(min = 1, max = 100, message = "Plan name must be between 1 and 100 characters")
    private String planName;

    private String planType;

    @NotNull(message = "Days per week is required")
    @Min(value = 1, message = "Days per week must be at least 1")
    @Max(value = 7, message = "Days per week must be at most 7")
    private Integer daysPerWeek;

    private String restDay;

    @NotBlank(message = "Exercise time is required")
    @Pattern(regexp = "^\\d{1,2}:\\d{2}\\s?(AM|PM)$", message = "Exercise time must be in format like '6:00 AM' or '10:30 PM'")
    private String exerciseTime;

    @NotNull(message = "Exercises list is required")
    @Size(min = 1, message = "At least one exercise is required")
    private List<@Valid CustomExerciseEntry> exercises;
}

