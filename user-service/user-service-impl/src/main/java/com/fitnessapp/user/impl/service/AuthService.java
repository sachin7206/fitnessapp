package com.fitnessapp.user.impl.service;

import com.fitnessapp.common.security.JwtTokenProvider;
import com.fitnessapp.user.common.dto.*;
import com.fitnessapp.user.impl.model.User;
import com.fitnessapp.user.impl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthOperations {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserService userService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email already registered");

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User.Profile profile = new User.Profile();
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setPhone(request.getPhone());
        profile.setLanguage(request.getLanguage());
        profile.setRegion(request.getRegion());
        user.setProfile(profile);
        user.setRoles(Collections.singletonList("USER"));
        user.setHealthMetrics(new User.HealthMetrics());
        user = userRepository.save(user);

        UserDetails ud = userDetailsService.loadUserByUsername(user.getEmail());
        return new AuthResponse(jwtTokenProvider.generateAccessToken(ud),
                jwtTokenProvider.generateRefreshToken(ud), userService.convertToDto(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDetails ud = userDetailsService.loadUserByUsername(request.getEmail());
        return new AuthResponse(jwtTokenProvider.generateAccessToken(ud),
                jwtTokenProvider.generateRefreshToken(ud), userService.convertToDto(user));
    }

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails ud = userDetailsService.loadUserByUsername(email);
        if (!jwtTokenProvider.validateToken(refreshToken, ud))
            throw new RuntimeException("Invalid refresh token");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new AuthResponse(jwtTokenProvider.generateAccessToken(ud),
                refreshToken, userService.convertToDto(user));
    }
}

