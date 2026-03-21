package com.fitnessapp.exercise.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomWorkoutLogSyncRequest {
    @NotBlank(message = "Date is required")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Date must be in YYYY-MM-DD format")
    private String date;

    @NotNull(message = "Logs data is required")
    @Size(max = 7, message = "Maximum 7 days of logs")
    private Map<String, Object> logs;
}

