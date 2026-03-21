package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "session_completions")
@Data @NoArgsConstructor @AllArgsConstructor
public class SessionCompletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id") private Long userId;
    @Column(name = "session_type") private String sessionType;
    @Column(name = "session_id") private Long sessionId;
    @Column(name = "duration_minutes") private Integer durationMinutes;
    @Column(name = "completed_date") private LocalDate completedDate;
    @Column(name = "completed_at") private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() { completedAt = LocalDateTime.now(); completedDate = LocalDate.now(); }
}

