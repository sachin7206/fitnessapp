package com.fitnessapp.exercise.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_workout_logs",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_custom_workout_log",
           columnNames = {"user_email", "log_date", "day_of_week", "exercise_index"}
       ))
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomWorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "day_of_week")
    private String dayOfWeek;

    @Column(name = "exercise_index")
    private Integer exerciseIndex;

    @Column(name = "exercise_name")
    private String exerciseName;

    @Column(name = "sets_data", columnDefinition = "TEXT")
    private String setsData; // JSON array: [{"reps":12,"weight":50}, ...]

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

