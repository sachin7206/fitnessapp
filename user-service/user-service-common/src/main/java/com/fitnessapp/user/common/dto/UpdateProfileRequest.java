package com.fitnessapp.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private ProfileData profile;
    private HealthMetricsData healthMetrics;
    private List<String> goals;
    private String firstName;
    private String lastName;
    private Integer age;
    private String gender;
    private String phone;
    private String language;
    private String region;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ProfileData {
        private String firstName;
        private String lastName;
        private Integer age;
        private String gender;
        private String phone;
        private String language;
        private String region;
        private String avatarUrl;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class HealthMetricsData {
        private Double height;
        private Double currentWeight;
        private Double targetWeight;
        private String activityLevel;
        private List<String> healthConditions;
        private List<String> dietaryPreferences;
    }
}

