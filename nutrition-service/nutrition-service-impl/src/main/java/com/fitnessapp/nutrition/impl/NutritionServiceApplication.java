package com.fitnessapp.nutrition.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
    "com.fitnessapp.nutrition.impl",
    "com.fitnessapp.nutrition.rest",
    "com.fitnessapp.common"
})
@EnableJpaAuditing
public class NutritionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NutritionServiceApplication.class, args);
    }
}

