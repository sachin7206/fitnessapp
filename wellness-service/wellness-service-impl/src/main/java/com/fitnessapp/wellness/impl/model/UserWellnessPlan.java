package com.fitnessapp.wellness.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "user_wellness_plans")
@Data @NoArgsConstructor @AllArgsConstructor
public class UserWellnessPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id") private Long userId;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "plan_id")
    private WellnessPlan wellnessPlan;
    @Column(name = "start_date") private LocalDate startDate;
    @Column(name = "end_date") private LocalDate endDate;
    private String status;
    @Column(name = "completed_sessions") private Integer completedSessions;
    @Column(name = "total_sessions") private Integer totalSessions;
    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}

