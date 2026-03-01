package com.fitnessapp.progress.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "daily_progress")
@Data @NoArgsConstructor @AllArgsConstructor
public class DailyProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_email") private String userEmail;
    @Column(name = "entry_date") private LocalDate entryDate;
    private Double weight;
    @Column(name = "weight_unit") private String weightUnit;
    private Double bmi;
    @Column(name = "body_fat_percentage") private Double bodyFatPercentage;
    @Column(name = "muscle_mass") private Double muscleMass;
    @Column(name = "photo_url") private String photoUrl;
    private String notes;
    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}

