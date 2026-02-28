package com.fitnessapp.exercise.impl.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class GeminiConfig {
    @Value("${gemini.api.key:}") private String apiKeyRaw;
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}") private String apiUrl;
    @Value("${gemini.model:gemini-2.0-flash}") private String model;
    @Value("${gemini.enabled:true}") private boolean enabled;
    @Value("${gemini.timeout.connect:10000}") private int connectTimeout;
    @Value("${gemini.timeout.read:60000}") private int readTimeout;

    @Bean(name = "geminiRestTemplate")
    public RestTemplate geminiRestTemplate() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(connectTimeout);
        f.setReadTimeout(readTimeout);
        return new RestTemplate(f);
    }

    public List<String> getApiKeys() {
        if (apiKeyRaw == null || apiKeyRaw.isBlank()) return List.of();
        return Arrays.stream(apiKeyRaw.split(",")).map(String::trim).filter(k -> !k.isBlank()).collect(Collectors.toList());
    }

    public boolean isEnabled() { return enabled; }
    public String getFullApiUrl(String apiKey) {
        return String.format("%s/%s:generateContent?key=%s", apiUrl, model, apiKey);
    }
}

