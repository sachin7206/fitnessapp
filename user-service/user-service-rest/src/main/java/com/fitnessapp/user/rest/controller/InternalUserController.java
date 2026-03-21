package com.fitnessapp.user.rest.controller;

import com.fitnessapp.user.common.dto.*;
import com.fitnessapp.user.rest.api.InternalUserApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class InternalUserController implements InternalUserApi {

    private final UserOperations userService;
    private final ProfileCompletionOperations profileCompletionService;

    @Override
    public ResponseEntity<UserDto> getUserByEmail(String email) {
        return ResponseEntity.ok(userService.getUserProfileByEmail(email));
    }

    @Override
    public ResponseEntity<ProfileCompletionStatusDTO> getProfileCompletion(String email) {
        return ResponseEntity.ok(profileCompletionService.checkProfileCompletion(email));
    }

    @Override
    public ResponseEntity<Boolean> isProfileCompleteForNutrition(String email) {
        return ResponseEntity.ok(profileCompletionService.isProfileCompleteForNutrition(email));
    }

    @Override
    public ResponseEntity<UserDto> getUserById(Long userId) {
        return ResponseEntity.ok(userService.getUserProfileById(userId));
    }
}
