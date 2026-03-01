package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "yoga_poses")
@Data @NoArgsConstructor @AllArgsConstructor
public class YogaPose {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(name = "sanskrit_name") private String sanskritName;
    @Column(length = 1000) private String description;
    @Column(length = 500) private String benefits;
    private String difficulty;
    @Column(name = "duration_seconds") private Integer durationSeconds;
    @Column(name = "image_url") private String imageUrl;
    private String category;
    @Column(length = 2000) private String instructions;
}

