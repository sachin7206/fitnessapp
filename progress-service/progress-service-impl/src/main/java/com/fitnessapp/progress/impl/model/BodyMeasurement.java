package com.fitnessapp.progress.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "body_measurements")
@Data @NoArgsConstructor @AllArgsConstructor
public class BodyMeasurement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_email") private String userEmail;
    @Column(name = "measurement_date") private LocalDate measurementDate;
    private Double chest;
    private Double waist;
    private Double hips;
    @Column(name = "left_arm") private Double leftArm;
    @Column(name = "right_arm") private Double rightArm;
    @Column(name = "left_thigh") private Double leftThigh;
    @Column(name = "right_thigh") private Double rightThigh;
    private Double neck;
    private String unit;
    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}

