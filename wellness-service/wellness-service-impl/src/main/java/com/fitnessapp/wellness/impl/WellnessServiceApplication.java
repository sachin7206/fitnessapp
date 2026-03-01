package com.fitnessapp.wellness.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
    "com.fitnessapp.wellness.impl",
    "com.fitnessapp.wellness.rest",
    "com.fitnessapp.common"
})
@EnableJpaAuditing
public class WellnessServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WellnessServiceApplication.class, args);
    }
}

