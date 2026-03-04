package com.fitnessapp.ai.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AiRestDayRequest {
    private List<Object> recentWorkouts;
    private List<String> muscleGroupsWorked;
    private int daysSinceLastRest;
    private String fitnessLevel;
}

