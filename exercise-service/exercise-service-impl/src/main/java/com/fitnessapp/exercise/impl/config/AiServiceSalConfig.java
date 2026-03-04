package com.fitnessapp.exercise.impl.config;

import com.fitnessapp.ai.sal.AiServiceSalClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiServiceSalConfig {

    @Bean
    @LoadBalanced
    public RestTemplate loadBalancedRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    public AiServiceSalClient aiServiceSalClient(RestTemplate loadBalancedRestTemplate) {
        return new AiServiceSalClient(loadBalancedRestTemplate, "http://ai-service");
    }
}

