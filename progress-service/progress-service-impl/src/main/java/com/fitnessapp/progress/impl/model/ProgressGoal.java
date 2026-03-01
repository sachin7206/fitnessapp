package com.fitnessapp.progress.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "progress_goals")
@Data @NoArgsConstructor @AllArgsConstructor
public class ProgressGoal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_email") private String userEmail;
    @Column(name = "goal_type") private String goalType;
    @Column(name = "target_value") private Double targetValue;
    @Column(name = "current_value") private Double currentValue;
    @Column(name = "start_value") private Double startValue;
    @Column(name = "start_date") private LocalDate startDate;
    @Column(name = "target_date") private LocalDate targetDate;
    private String unit;
    @Column(name = "is_active") private Boolean isActive;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

