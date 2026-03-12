package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomWorkoutLogSyncRequest {
    private String date;
    private Map<String, Object> logs; // day -> { exerciseIndex -> { sets: [...] } }
}

