package com.fitnessapp.nutrition.impl.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.nutrition.common.dto.*;
import com.fitnessapp.nutrition.impl.model.FoodLog;
import com.fitnessapp.nutrition.impl.repository.FoodLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FoodLoggingService implements FoodLoggingOperations {

    private final FoodLogRepository foodLogRepository;
    private final AiServiceSalClient aiSalClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public FoodLogDTO logFoodPhoto(Long userId, FoodPhotoLogRequest request) {
        AiFoodPhotoAnalysisResponse analysis;
        try {
            AiFoodPhotoAnalysisRequest aiRequest = new AiFoodPhotoAnalysisRequest(
                    request.getImageBase64(), request.getDescription());
            analysis = aiSalClient.analyzeFoodPhoto(aiRequest);
        } catch (Exception e) {
            log.warn("AI food photo analysis failed, using fallback: {}", e.getMessage());
            analysis = new AiFoodPhotoAnalysisResponse();
            analysis.setTotalCalories(400);
            analysis.setTotalProtein(15.0);
            analysis.setTotalCarbs(45.0);
            analysis.setTotalFat(12.0);
            analysis.setConfidence(0.0);
            analysis.setFromAi(false);
            analysis.setFoodItems(new ArrayList<>());
        }

        FoodLog log = new FoodLog();
        log.setUserId(userId);
        log.setLogDate(LocalDate.now());
        log.setMealType(request.getMealType());
        log.setDescription(request.getDescription());
        log.setSource(request.getSource() != null ? request.getSource() : "PHOTO");
        log.setTotalCalories(analysis.getTotalCalories());
        log.setTotalProtein(analysis.getTotalProtein());
        log.setTotalCarbs(analysis.getTotalCarbs());
        log.setTotalFat(analysis.getTotalFat());
        log.setConfidence(analysis.getConfidence());

        try {
            log.setFoodItemsJson(objectMapper.writeValueAsString(analysis.getFoodItems()));
        } catch (Exception e) {
            log.setFoodItemsJson("[]");
        }

        FoodLog saved = foodLogRepository.save(log);
        return toDTO(saved);
    }

    public List<FoodLogDTO> getTodayFoodLogs(Long userId) {
        return foodLogRepository.findByUserIdAndLogDateOrderByCreatedAtDesc(userId, LocalDate.now())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<FoodLogDTO> getFoodLogHistory(Long userId, int days) {
        return foodLogRepository.findByUserIdAndLogDateAfterOrderByLogDateDescCreatedAtDesc(
                userId, LocalDate.now().minusDays(days))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private FoodLogDTO toDTO(FoodLog entity) {
        FoodLogDTO dto = new FoodLogDTO();
        dto.setId(entity.getId());
        dto.setLogDate(entity.getLogDate());
        dto.setMealType(entity.getMealType());
        dto.setDescription(entity.getDescription());
        dto.setSource(entity.getSource());
        dto.setTotalCalories(entity.getTotalCalories());
        dto.setTotalProtein(entity.getTotalProtein());
        dto.setTotalCarbs(entity.getTotalCarbs());
        dto.setTotalFat(entity.getTotalFat());
        dto.setConfidence(entity.getConfidence());
        dto.setCreatedAt(entity.getCreatedAt());
        try {
            dto.setFoodItems(objectMapper.readValue(entity.getFoodItemsJson(), List.class));
        } catch (Exception e) {
            dto.setFoodItems(new ArrayList<>());
        }
        return dto;
    }
}

