package com.fitnessapp.user.impl.service;

import com.fitnessapp.user.common.dto.ProfileCompletionOperations;
import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import com.fitnessapp.user.impl.model.User;
import com.fitnessapp.user.impl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileCompletionService implements ProfileCompletionOperations {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ProfileCompletionStatusDTO checkProfileCompletion(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> missing = new ArrayList<>();
        int total = 8, completed = 0;
        boolean hasPersonal = false, hasHealth = false, hasDiet = false, hasGoals = false;

        if (user.getProfile() != null) {
            var p = user.getProfile();
            if (p.getFirstName() != null && !p.getFirstName().isEmpty()) completed++; else missing.add("firstName");
            if (p.getAge() != null && p.getAge() > 0) { completed++; hasPersonal = true; } else missing.add("age");
            if (p.getGender() != null && !p.getGender().isEmpty()) completed++; else missing.add("gender");
        } else { missing.addAll(List.of("firstName", "age", "gender")); }

        if (user.getHealthMetrics() != null) {
            var m = user.getHealthMetrics();
            if (m.getHeight() != null && m.getHeight() > 0) completed++; else missing.add("height");
            if (m.getCurrentWeight() != null && m.getCurrentWeight() > 0) { completed++; hasHealth = true; } else missing.add("currentWeight");
            if (m.getActivityLevel() != null && !m.getActivityLevel().isEmpty()) completed++; else missing.add("activityLevel");
            if (m.getDietaryPreferences() != null && !m.getDietaryPreferences().isEmpty()) { completed++; hasDiet = true; } else missing.add("dietaryPreference");
        } else { missing.addAll(List.of("height", "currentWeight", "activityLevel", "dietaryPreference")); }

        if (user.getGoals() != null && !user.getGoals().isEmpty()) { completed++; hasGoals = true; } else missing.add("goals");

        int pct = (completed * 100) / total;
        boolean isComplete = missing.isEmpty() || (hasPersonal && hasHealth && hasDiet && hasGoals);
        return new ProfileCompletionStatusDTO(isComplete, hasPersonal, hasHealth, hasGoals, hasDiet, missing, pct);
    }

    public boolean isProfileCompleteForNutrition(String email) {
        var s = checkProfileCompletion(email);
        return s.isHasPersonalInfo() && s.isHasHealthMetrics() && s.isHasDietaryPreference() && s.isHasGoals();
    }
}

