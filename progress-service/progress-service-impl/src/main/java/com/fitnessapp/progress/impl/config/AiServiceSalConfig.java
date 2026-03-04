package com.fitnessapp.progress.impl.config;

import com.fitnessapp.ai.sal.AiServiceSalClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiServiceSalConfig {

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
    public AiServiceSalClient aiServiceSalClientEureka(RestTemplate loadBalancedRestTemplate) {
        return new AiServiceSalClient(loadBalancedRestTemplate, "http://ai-service");
    }

    @Bean
    @Profile("prod")
    public AiServiceSalClient aiServiceSalClientDirect(RestTemplate directRestTemplate,
            @Value("${services.ai-service-url:http://localhost:8086}") String aiServiceUrl) {
        return new AiServiceSalClient(directRestTemplate, aiServiceUrl);
    }
}
