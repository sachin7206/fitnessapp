package com.fitnessapp.user.impl.service;

import com.fitnessapp.user.common.dto.*;
import com.fitnessapp.user.impl.model.User;
import com.fitnessapp.user.impl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserOperations {
    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserDto getCurrentUserProfile() {
        return convertToDto(getCurrentUser());
    }

    public UserDto getUserProfileByEmail(String email) {
        return convertToDto(getUserByEmail(email));
    }

    public UserDto updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        User.Profile profile = user.getProfile() != null ? user.getProfile() : new User.Profile();

        if (request.getProfile() != null) {
            var pd = request.getProfile();
            if (pd.getFirstName() != null) profile.setFirstName(pd.getFirstName());
            if (pd.getLastName() != null) profile.setLastName(pd.getLastName());
            if (pd.getAge() != null) profile.setAge(pd.getAge());
            if (pd.getGender() != null) profile.setGender(pd.getGender());
            if (pd.getPhone() != null) profile.setPhone(pd.getPhone());
            if (pd.getLanguage() != null) profile.setLanguage(pd.getLanguage());
            if (pd.getRegion() != null) profile.setRegion(pd.getRegion());
            if (pd.getAvatarUrl() != null) profile.setAvatarUrl(pd.getAvatarUrl());
        }
        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) profile.setLastName(request.getLastName());
        if (request.getAge() != null) profile.setAge(request.getAge());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getLanguage() != null) profile.setLanguage(request.getLanguage());
        if (request.getRegion() != null) profile.setRegion(request.getRegion());
        user.setProfile(profile);

        if (request.getHealthMetrics() != null) {
            User.HealthMetrics hm = user.getHealthMetrics() != null ? user.getHealthMetrics() : new User.HealthMetrics();
            var hd = request.getHealthMetrics();
            if (hd.getHeight() != null) hm.setHeight(hd.getHeight());
            if (hd.getCurrentWeight() != null) hm.setCurrentWeight(hd.getCurrentWeight());
            if (hd.getTargetWeight() != null) hm.setTargetWeight(hd.getTargetWeight());
            if (hd.getActivityLevel() != null) hm.setActivityLevel(hd.getActivityLevel());
            if (hd.getHealthConditions() != null) hm.setHealthConditions(hd.getHealthConditions());
            if (hd.getDietaryPreferences() != null) hm.setDietaryPreferences(hd.getDietaryPreferences());
            user.setHealthMetrics(hm);
        }
        if (request.getGoals() != null) user.setGoals(request.getGoals());
        return convertToDto(userRepository.save(user));
    }

    public UserDto updateHealthMetrics(UpdateHealthMetricsRequest request) {
        User user = getCurrentUser();
        User.HealthMetrics hm = user.getHealthMetrics() != null ? user.getHealthMetrics() : new User.HealthMetrics();
        if (request.getHeight() != null) hm.setHeight(request.getHeight());
        if (request.getCurrentWeight() != null) hm.setCurrentWeight(request.getCurrentWeight());
        if (request.getTargetWeight() != null) hm.setTargetWeight(request.getTargetWeight());
        if (request.getActivityLevel() != null) hm.setActivityLevel(request.getActivityLevel());
        if (request.getHealthConditions() != null) hm.setHealthConditions(request.getHealthConditions());
        if (request.getDietaryPreferences() != null) hm.setDietaryPreferences(request.getDietaryPreferences());
        user.setHealthMetrics(hm);
        return convertToDto(userRepository.save(user));
    }

    public UserDto updateGoals(List<String> goals) {
        User user = getCurrentUser();
        user.setGoals(goals);
        return convertToDto(userRepository.save(user));
    }

    public UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setGoals(user.getGoals());
        dto.setCreatedAt(user.getCreatedAt());
        if (user.getProfile() != null) {
            var p = user.getProfile();
            dto.setProfile(new UserDto.ProfileDto(p.getFirstName(), p.getLastName(), p.getAge(),
                    p.getGender(), p.getPhone(), p.getLanguage(), p.getRegion(), p.getAvatarUrl()));
        }
        if (user.getHealthMetrics() != null) {
            var m = user.getHealthMetrics();
            dto.setHealthMetrics(new UserDto.HealthMetricsDto(m.getHeight(), m.getCurrentWeight(),
                    m.getTargetWeight(), m.getActivityLevel(), m.getHealthConditions(), m.getDietaryPreferences()));
        }
        return dto;
    }
}
