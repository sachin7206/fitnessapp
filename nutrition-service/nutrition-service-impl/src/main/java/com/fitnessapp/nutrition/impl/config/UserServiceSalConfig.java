package com.fitnessapp.nutrition.impl.config;

import com.fitnessapp.user.sal.UserServiceSalClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class UserServiceSalConfig {

    @Bean
    @LoadBalanced
    public RestTemplate loadBalancedRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    public UserServiceSalClient userServiceSalClient(RestTemplate loadBalancedRestTemplate) {
        return new UserServiceSalClient(loadBalancedRestTemplate, "http://user-service");
    }
}

