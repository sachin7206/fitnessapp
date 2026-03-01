package com.fitnessapp.user.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Embedded
    private Profile profile;

    @Embedded
    private HealthMetrics healthMetrics;

    @ElementCollection
    @CollectionTable(name = "user_goals", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "goal")
    private List<String> goals = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private List<String> roles = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private String passwordResetToken;
    private LocalDateTime passwordResetExpiry;

    @Embeddable
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Profile {
        private String firstName;
        private String lastName;
        private Integer age;
        private String gender;
        private String phone;
        private String language;
        private String region;
        private String avatarUrl;
    }

    @Embeddable
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class HealthMetrics {
        private Double height;
        private Double currentWeight;
        private Double targetWeight;
        private String activityLevel;

        @ElementCollection
        @CollectionTable(name = "user_health_conditions", joinColumns = @JoinColumn(name = "user_id"))
        @Column(name = "condition_name")
        private List<String> healthConditions = new ArrayList<>();

        @ElementCollection
        @CollectionTable(name = "user_dietary_preferences", joinColumns = @JoinColumn(name = "user_id"))
        @Column(name = "preference")
        private List<String> dietaryPreferences = new ArrayList<>();
    }
}

