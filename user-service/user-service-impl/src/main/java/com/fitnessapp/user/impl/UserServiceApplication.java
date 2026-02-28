package com.fitnessapp.user.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
    "com.fitnessapp.user.impl",
    "com.fitnessapp.user.rest",
    "com.fitnessapp.common"
})
@EnableJpaAuditing
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

