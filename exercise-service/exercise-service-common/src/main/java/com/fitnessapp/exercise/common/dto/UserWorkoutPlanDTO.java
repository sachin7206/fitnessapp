package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWorkoutPlanDTO {
    private Long id;
    private String userEmail;
    private WorkoutPlanDTO workoutPlan;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer completedWorkouts;
    private Integer totalWorkouts;
    private Integer currentWeek;
}

