package com.fitnessapp.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private ProfileDto profile;
    private HealthMetricsDto healthMetrics;
    private List<String> goals;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileDto {
        private String firstName;
        private String lastName;
        private Integer age;
        private String gender;
        private String phone;
        private String language;
        private String region;
        private String avatarUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthMetricsDto {
        private Double height;
        private Double currentWeight;
        private Double targetWeight;
        private String activityLevel;
        private List<String> healthConditions;
        private List<String> dietaryPreferences;
    }
}

