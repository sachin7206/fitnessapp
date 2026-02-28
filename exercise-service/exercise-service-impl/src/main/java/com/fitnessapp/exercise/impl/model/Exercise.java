package com.fitnessapp.exercise.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    @CollectionTable(name = "exercise_names", joinColumns = @JoinColumn(name = "exercise_id"))
    @MapKeyColumn(name = "language")
    @Column(name = "name")
    private Map<String, String> name = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "exercise_descriptions", joinColumns = @JoinColumn(name = "exercise_id"))
    @MapKeyColumn(name = "language")
    @Column(name = "description", length = 1000)
    private Map<String, String> description = new HashMap<>();

    private String category;
    private String difficulty;
    private Double caloriesBurnedPerMin;

    @ElementCollection
    @CollectionTable(name = "exercise_equipment", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "equipment")
    private List<String> equipment = new ArrayList<>();

    private String videoUrl;
    private String thumbnailUrl;
    private String culturalOrigin;

    @ElementCollection
    @CollectionTable(name = "exercise_muscle_groups", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "muscle_group")
    private List<String> muscleGroups = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "exercise_tags", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();
}

