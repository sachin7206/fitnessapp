package com.fitnessapp.user.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import com.fitnessapp.user.common.dto.*;
import com.fitnessapp.user.rest.api.UserApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserController implements UserApi {

    private final UserOperations userService;

    @Override
    public ResponseEntity<ApiResponse> getProfile() {
        UserDto user = userService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", user));
    }

    @Override
    public ResponseEntity<ApiResponse> updateProfile(UpdateProfileRequest request) {
        UserDto user = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", user));
    }

    @Override
    public ResponseEntity<ApiResponse> updateHealthMetrics(UpdateHealthMetricsRequest request) {
        UserDto user = userService.updateHealthMetrics(request);
        return ResponseEntity.ok(ApiResponse.success("Health metrics updated successfully", user));
    }

    @Override
    public ResponseEntity<ApiResponse> updateGoals(List<String> goals) {
        UserDto user = userService.updateGoals(goals);
        return ResponseEntity.ok(ApiResponse.success("Goals updated successfully", user));
    }
}
