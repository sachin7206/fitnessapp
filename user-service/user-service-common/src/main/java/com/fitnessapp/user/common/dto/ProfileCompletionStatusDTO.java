package com.fitnessapp.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileCompletionStatusDTO {
    private boolean isComplete;
    private boolean hasPersonalInfo;
    private boolean hasHealthMetrics;
    private boolean hasGoals;
    private boolean hasDietaryPreference;
    private List<String> missingFields;
    private int completionPercentage;
}

