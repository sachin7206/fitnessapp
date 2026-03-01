package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "wellness_tips")
@Data @NoArgsConstructor @AllArgsConstructor
public class WellnessTip {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(length = 1000) private String content;
    private String category;
    @Column(name = "day_number") private Integer dayNumber;
}

