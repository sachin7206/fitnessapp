package com.fitnessapp.exercise.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseDTO {
    private Long id;
    private Map<String, String> name;
    private Map<String, String> description;
    private String category;
    private String difficulty;
    private Double caloriesBurnedPerMin;
    private List<String> equipment;
    private String videoUrl;
    private String thumbnailUrl;
    private String culturalOrigin;
    private List<String> muscleGroups;
    private List<String> tags;
}

