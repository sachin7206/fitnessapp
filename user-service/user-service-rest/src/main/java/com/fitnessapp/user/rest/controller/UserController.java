package com.fitnessapp.user.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import com.fitnessapp.user.common.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserOperations userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getProfile() {
        UserDto user = userService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(@RequestBody UpdateProfileRequest request) {
        UserDto user = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", user));
    }

    @PutMapping("/health-metrics")
    public ResponseEntity<ApiResponse<UserDto>> updateHealthMetrics(@RequestBody UpdateHealthMetricsRequest request) {
        UserDto user = userService.updateHealthMetrics(request);
        return ResponseEntity.ok(ApiResponse.success("Health metrics updated successfully", user));
    }

    @PutMapping("/goals")
    public ResponseEntity<ApiResponse<UserDto>> updateGoals(@RequestBody List<String> goals) {
        UserDto user = userService.updateGoals(goals);
        return ResponseEntity.ok(ApiResponse.success("Goals updated successfully", user));
    }
}
