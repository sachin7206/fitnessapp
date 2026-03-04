package com.fitnessapp.ai.impl.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Centralized Gemini configuration.
 * API keys and model name are configured once here, used by all AI operations.
 */
@Configuration
public class GeminiConfig {

    @Value("${gemini.api.keys:}")
    private String apiKeysRaw;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiUrl;

    @Value("${gemini.model:gemma-3-27b-it}")
    private String model;

    @Value("${gemini.enabled:true}")
    private boolean enabled;

    @Value("${gemini.timeout.connect:15000}")
    private int connectTimeout;

    @Value("${gemini.timeout.read:120000}")
    private int readTimeout;

    public List<String> getApiKeys() {
        if (apiKeysRaw == null || apiKeysRaw.isBlank()) return List.of();
        return Arrays.stream(apiKeysRaw.split(","))
                .map(String::trim)
                .filter(k -> !k.isBlank())
                .collect(Collectors.toList());
    }

    public String getApiUrl() { return apiUrl; }
    public String getModel() { return model; }
    public boolean isEnabled() { return enabled; }
    public int getConnectTimeout() { return connectTimeout; }
    public int getReadTimeout() { return readTimeout; }

    public String getFullApiUrl(String apiKey) {
        return String.format("%s/%s:generateContent?key=%s", apiUrl, model, apiKey);
    }
}

