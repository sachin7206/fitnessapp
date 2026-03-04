package com.fitnessapp.wellness.rest.controller;

import com.fitnessapp.wellness.rest.api.HealthApi;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class HealthController implements HealthApi {

    @Override
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Wellness Service", "version", "1.0.0"));
    }
}
