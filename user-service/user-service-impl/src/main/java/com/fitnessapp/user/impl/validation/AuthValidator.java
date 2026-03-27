package com.fitnessapp.user.impl.validation;

import com.fitnessapp.user.impl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for authentication operations.
 */
@Component
@RequiredArgsConstructor
public class AuthValidator {

    private final UserRepository userRepository;

    /**
     * Validate that the email is not already registered.
     */
    public void validateEmailNotRegistered(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("You are already registered. Please login. If you forgot your password, please reset your password.");
        }
    }

    /**
     * Validate password strength requirements.
     */
    public void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("Password must contain at least one lowercase letter");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("Password must contain at least one number");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new RuntimeException("Password must contain at least one special character (!@#$%^&*...)");
        }
    }

    /**
     * Validate that a refresh token is valid.
     */
    public void validateRefreshToken(boolean isValid) {
        if (!isValid) {
            throw new RuntimeException("Invalid refresh token");
        }
    }
}

