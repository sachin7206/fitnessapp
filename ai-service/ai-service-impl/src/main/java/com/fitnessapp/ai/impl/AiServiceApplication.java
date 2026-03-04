package com.fitnessapp.ai.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(
    scanBasePackages = {
        "com.fitnessapp.ai.impl",
        "com.fitnessapp.ai.rest",
        "com.fitnessapp.common"
    },
    exclude = {DataSourceAutoConfiguration.class}
)
public class AiServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiServiceApplication.class, args);
    }
}

