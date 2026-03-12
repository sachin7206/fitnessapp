package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomWorkoutLogDTO {
    private Long id;
    private String userEmail;
    private LocalDate logDate;
    private String dayOfWeek;
    private Integer exerciseIndex;
    private String exerciseName;
    private String setsData; // JSON string of sets
    private LocalDateTime completedAt;
}

