package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "breathing_exercises")
@Data @NoArgsConstructor @AllArgsConstructor
public class BreathingExercise {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String technique;
    private String pattern;
    @Column(name = "duration_minutes") private Integer durationMinutes;
    @Column(length = 1000) private String description;
    @Column(length = 500) private String benefits;
    private String difficulty;
}

