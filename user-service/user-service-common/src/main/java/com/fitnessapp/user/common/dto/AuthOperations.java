package com.fitnessapp.user.common.dto;

public interface AuthOperations {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
}

