package com.fitnessapp.exercise.rest.controller;

import com.fitnessapp.exercise.rest.api.HealthApi;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class HealthController implements HealthApi {

    @Override
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Exercise Service", "version", "1.0.0"));
    }
}
