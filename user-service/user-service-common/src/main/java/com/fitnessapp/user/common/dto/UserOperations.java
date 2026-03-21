package com.fitnessapp.user.common.dto;

import java.util.List;

public interface UserOperations {
    UserDto getCurrentUserProfile();
    UserDto getUserProfileByEmail(String email);
    UserDto getUserProfileById(Long userId);
    UserDto updateProfile(UpdateProfileRequest request);
    UserDto updateHealthMetrics(UpdateHealthMetricsRequest request);
    UserDto updateGoals(List<String> goals);
}
