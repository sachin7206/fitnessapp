package com.fitnessapp.subscription.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
    "com.fitnessapp.subscription.impl",
    "com.fitnessapp.subscription.rest",
    "com.fitnessapp.common"
})
@EnableJpaAuditing
public class SubscriptionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SubscriptionServiceApplication.class, args);
    }
}

