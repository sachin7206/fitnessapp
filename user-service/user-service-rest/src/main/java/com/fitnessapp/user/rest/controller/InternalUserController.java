package com.fitnessapp.user.rest.controller;

import com.fitnessapp.user.common.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserOperations userService;
    private final ProfileCompletionOperations profileCompletionService;

    @GetMapping("/by-email")
    public ResponseEntity<UserDto> getUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.getUserProfileByEmail(email));
    }

    @GetMapping("/{email}/profile-completion")
    public ResponseEntity<ProfileCompletionStatusDTO> getProfileCompletion(@PathVariable String email) {
        return ResponseEntity.ok(profileCompletionService.checkProfileCompletion(email));
    }

    @GetMapping("/{email}/profile-complete-for-nutrition")
    public ResponseEntity<Boolean> isProfileCompleteForNutrition(@PathVariable String email) {
        return ResponseEntity.ok(profileCompletionService.isProfileCompleteForNutrition(email));
    }
}
