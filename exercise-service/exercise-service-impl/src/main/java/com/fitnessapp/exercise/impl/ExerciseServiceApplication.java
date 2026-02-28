package com.fitnessapp.exercise.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
    "com.fitnessapp.exercise.impl",
    "com.fitnessapp.exercise.rest",
    "com.fitnessapp.common"
})
@EnableJpaAuditing
public class ExerciseServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ExerciseServiceApplication.class, args);
    }
}

