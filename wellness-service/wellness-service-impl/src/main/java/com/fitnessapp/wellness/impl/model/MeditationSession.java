package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "meditation_sessions")
@Data @NoArgsConstructor @AllArgsConstructor
public class MeditationSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String type;
    @Column(name = "duration_minutes") private Integer durationMinutes;
    @Column(length = 1000) private String description;
    @Column(name = "audio_url") private String audioUrl;
    private String difficulty;
    @Column(length = 500) private String benefits;
}

