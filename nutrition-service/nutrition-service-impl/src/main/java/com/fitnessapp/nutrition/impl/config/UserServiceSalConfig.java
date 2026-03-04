package com.fitnessapp.nutrition.impl.config;

import com.fitnessapp.user.sal.UserServiceSalClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestTemplate;

@Configuration
public class UserServiceSalConfig {

    @Bean
    @LoadBalanced
    @Profile("!prod")
    public RestTemplate loadBalancedRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    @Profile("prod")
    public RestTemplate directRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    @Profile("!prod")
    public UserServiceSalClient userServiceSalClientEureka(RestTemplate loadBalancedRestTemplate) {
        return new UserServiceSalClient(loadBalancedRestTemplate, "http://user-service");
    }

    @Bean
    @Profile("prod")
    public UserServiceSalClient userServiceSalClientDirect(RestTemplate directRestTemplate,
            @Value("${services.user-service-url:http://localhost:8081}") String userServiceUrl) {
        return new UserServiceSalClient(directRestTemplate, userServiceUrl);
    }
}
