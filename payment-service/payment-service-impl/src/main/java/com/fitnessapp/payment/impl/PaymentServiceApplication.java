package com.fitnessapp.payment.impl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
    "com.fitnessapp.payment.impl",
    "com.fitnessapp.payment.rest",
    "com.fitnessapp.common"
})
@EnableJpaAuditing
public class PaymentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }
}

