package com.fitnessapp.user.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        return ResponseEntity.ok(ApiResponse.success("Service is healthy",
                Map.of("status", "UP", "service", "User Service", "version", "1.0.0")));
    }
}

