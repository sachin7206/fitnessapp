package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "wellness_plans")
@Data @NoArgsConstructor @AllArgsConstructor
public class WellnessPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "plan_name") private String planName;
    private String type;
    private String level;
    @Column(name = "duration_weeks") private Integer durationWeeks;
    @Column(name = "sessions_per_week") private Integer sessionsPerWeek;
    @Column(name = "session_duration_minutes") private Integer sessionDurationMinutes;
    @Column(length = 1000) private String description;
    @Column(name = "sessions_json", length = 5000) private String sessionsJson;
    @Column(name = "total_calories_burned") private Integer totalCaloriesBurned;
}

