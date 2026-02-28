package com.fitnessapp.user.common.dto;

public interface ProfileCompletionOperations {
    ProfileCompletionStatusDTO checkProfileCompletion(String email);
    boolean isProfileCompleteForNutrition(String email);
}

