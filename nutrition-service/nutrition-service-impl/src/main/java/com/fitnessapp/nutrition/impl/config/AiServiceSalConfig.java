package com.fitnessapp.nutrition.impl.config;

import com.fitnessapp.ai.sal.AiServiceSalClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configures the AI Service SAL client.
 * Reuses the loadBalancedRestTemplate bean from UserServiceSalConfig.
 */
@Configuration
public class AiServiceSalConfig {

    @Bean
    public AiServiceSalClient aiServiceSalClient(RestTemplate loadBalancedRestTemplate) {
        return new AiServiceSalClient(loadBalancedRestTemplate, "http://ai-service");
    }
}

