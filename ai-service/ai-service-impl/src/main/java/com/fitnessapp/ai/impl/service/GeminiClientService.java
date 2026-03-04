package com.fitnessapp.ai.impl.service;

import com.fitnessapp.ai.impl.config.GeminiConfig;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import com.google.genai.types.GenerateContentConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.List;

/**
 * Core Gemini client service using the official Google GenAI Java SDK.
 * Handles API key rotation and provides a single point for all Gemini calls.
 */
@Service
@Slf4j
public class GeminiClientService {

    private final GeminiConfig geminiConfig;

    public GeminiClientService(GeminiConfig geminiConfig) {
        this.geminiConfig = geminiConfig;
    }

    @PostConstruct
    public void init() {
        log.info("Gemini AI Service initialized. Model: {}, Keys: {}, Enabled: {}",
                geminiConfig.getModel(), geminiConfig.getApiKeys().size(), geminiConfig.isEnabled());
    }

    public boolean isAvailable() {
        return geminiConfig.isEnabled() && !geminiConfig.getApiKeys().isEmpty();
    }

    /**
     * Generate content using Gemini SDK with API key rotation.
     * @param prompt the text prompt
     * @param jsonMode whether to request JSON response format
     * @return the generated text content
     */
    public String generateContent(String prompt, boolean jsonMode) {
        List<String> apiKeys = geminiConfig.getApiKeys();
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("No Gemini API keys configured");
        }

        for (String apiKey : apiKeys) {
            try {
                Client client = Client.builder().apiKey(apiKey).build();

                GenerateContentConfig.Builder configBuilder = GenerateContentConfig.builder()
                        .temperature(0.7f)
                        .maxOutputTokens(8192);

                if (jsonMode) {
                    configBuilder.responseMimeType("application/json");
                }

                GenerateContentResponse response = client.models.generateContent(
                        geminiConfig.getModel(),
                        prompt,
                        configBuilder.build()
                );

                String text = response.text();
                if (text != null && !text.isBlank()) {
                    log.debug("Gemini response received, length: {}", text.length());
                    return text;
                }
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "";
                if (msg.contains("429") || msg.contains("quota") || msg.contains("RESOURCE_EXHAUSTED")) {
                    log.warn("Gemini API key rate limited, trying next key...");
                    continue;
                }
                log.error("Gemini API error with key: {}", msg);
                throw new RuntimeException("Gemini API error: " + msg, e);
            }
        }
        throw new RuntimeException("All Gemini API keys exhausted");
    }

    /**
     * Generate JSON content using Gemini SDK.
     */
    public String generateJsonContent(String prompt) {
        return generateContent(prompt, true);
    }

    /**
     * Generate plain text content using Gemini SDK.
     */
    public String generateTextContent(String prompt) {
        return generateContent(prompt, false);
    }
}

