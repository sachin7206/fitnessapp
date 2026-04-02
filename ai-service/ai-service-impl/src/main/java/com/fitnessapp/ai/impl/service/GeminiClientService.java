package com.fitnessapp.ai.impl.service;

import com.fitnessapp.ai.impl.config.GeminiConfig;
import com.fitnessapp.ai.impl.validation.AiValidator;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import com.google.genai.types.GenerateContentConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.Base64;
import java.util.List;

/**
 * Core Gemini client service using the official Google GenAI Java SDK.
 * Handles API key rotation and provides a single point for all Gemini calls.
 */
@Service
@Slf4j
public class GeminiClientService {

    private final GeminiConfig geminiConfig;
    private final AiValidator aiValidator;

    public GeminiClientService(GeminiConfig geminiConfig, AiValidator aiValidator) {
        this.geminiConfig = geminiConfig;
        this.aiValidator = aiValidator;
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
        aiValidator.validateApiKeysConfigured(!apiKeys.isEmpty());

        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            if (attempt > 0) {
                long waitSeconds = 15L * attempt; // 15s, 30s, 45s
                log.info("All keys rate limited, waiting {}s before retry {}/{}...", waitSeconds, attempt + 1, maxRetries);
                try { Thread.sleep(waitSeconds * 1000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
            }

            boolean allRateLimited = true;
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
                        log.info("Gemini AI response received (attempt {}), length: {}", attempt + 1, text.length());
                        return text;
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : "";
                    if (msg.contains("429") || msg.contains("quota") || msg.contains("RESOURCE_EXHAUSTED")) {
                        log.warn("Gemini API key rate limited (attempt {}), trying next key...", attempt + 1);
                        continue;
                    }
                    // If JSON mode is not supported by this model, retry without JSON mode
                    if (jsonMode && (msg.contains("400") || msg.contains("JSON mode is not enabled"))) {
                        log.warn("JSON mode not supported by model {}, retrying without JSON mode", geminiConfig.getModel());
                        return generateContent(prompt, false);
                    }
                    allRateLimited = false;
                    log.error("Gemini API error with key: {}", msg);
                    throw new RuntimeException("Gemini API error: " + msg, e);
                }
            }
            // If not all were rate limited (some other error), don't retry
            if (!allRateLimited) break;
        }
        throw new RuntimeException("All Gemini API keys exhausted after " + maxRetries + " retries");
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

    /**
     * Generate content with an image (multimodal) using Base64-encoded image.
     * @param prompt the text prompt
     * @param imageBase64 the Base64-encoded image string
     * @param jsonMode whether to request JSON response format
     * @return the generated text content
     */
    public String generateContentWithImage(String prompt, String imageBase64, boolean jsonMode) {
        List<String> apiKeys = geminiConfig.getApiKeys();
        aiValidator.validateApiKeysConfigured(!apiKeys.isEmpty());

        for (String apiKey : apiKeys) {
            try {
                Client client = Client.builder().apiKey(apiKey).build();

                GenerateContentConfig.Builder configBuilder = GenerateContentConfig.builder()
                        .temperature(0.7f)
                        .maxOutputTokens(8192);

                if (jsonMode) {
                    configBuilder.responseMimeType("application/json");
                }

                // Build multimodal content with image and text
                byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
                Part imagePart = Part.fromBytes(imageBytes, "image/jpeg");
                Part textPart = Part.fromText(prompt);
                Content content = Content.builder()
                        .role("user")
                        .parts(List.of(imagePart, textPart))
                        .build();

                GenerateContentResponse response = client.models.generateContent(
                        geminiConfig.getModel(),
                        List.of(content),
                        configBuilder.build()
                );

                String text = response.text();
                if (text != null && !text.isBlank()) {
                    log.debug("Gemini multimodal response received, length: {}", text.length());
                    return text;
                }
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "";
                if (msg.contains("429") || msg.contains("quota") || msg.contains("RESOURCE_EXHAUSTED")) {
                    log.warn("Gemini API key rate limited for multimodal, trying next key...");
                    continue;
                }
                log.error("Gemini multimodal API error: {}", msg);
                throw new RuntimeException("Gemini multimodal API error: " + msg, e);
            }
        }
        throw new RuntimeException("All Gemini API keys exhausted for multimodal request");
    }
}

