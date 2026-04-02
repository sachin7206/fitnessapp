package com.fitnessapp.exercise.impl.service;

import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.exercise.common.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExerciseEnhancementService implements ExerciseEnhancementOperations {

    private final AiServiceSalClient aiSalClient;

    public ExerciseSubstitutionResponseDTO suggestExerciseSubstitutes(Long userId, ExerciseSubstitutionRequestDTO request) {
        try {
            AiExerciseSubstitutionRequest aiRequest = new AiExerciseSubstitutionRequest();
            aiRequest.setExerciseName(request.getExerciseName());
            aiRequest.setMuscleGroup(request.getMuscleGroup());
            aiRequest.setReason(request.getReason());
            aiRequest.setAvailableEquipment(request.getAvailableEquipment());
            aiRequest.setInjuredBodyParts(request.getInjuredBodyParts());

            AiExerciseSubstitutionResponse aiResponse = aiSalClient.suggestExerciseSubstitutes(aiRequest);

            ExerciseSubstitutionResponseDTO response = new ExerciseSubstitutionResponseDTO();
            response.setOriginalExercise(request.getExerciseName());
            response.setAlternatives(aiResponse.getAlternatives() != null
                    ? new ArrayList<>(aiResponse.getAlternatives()) : new ArrayList<>());
            response.setFromAi(aiResponse.isFromAi());
            return response;
        } catch (Exception e) {
            log.warn("Exercise substitution failed: {}", e.getMessage());
            ExerciseSubstitutionResponseDTO fallback = new ExerciseSubstitutionResponseDTO();
            fallback.setOriginalExercise(request.getExerciseName());
            fallback.setAlternatives(new ArrayList<>());
            fallback.setFromAi(false);
            return fallback;
        }
    }
}
