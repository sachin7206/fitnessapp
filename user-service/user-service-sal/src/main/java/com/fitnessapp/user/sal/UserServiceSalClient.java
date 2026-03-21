package com.fitnessapp.user.sal;

import com.fitnessapp.user.common.dto.ProfileCompletionStatusDTO;
import com.fitnessapp.user.common.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestTemplate;

/**
 * Service Abstraction Layer for calling User Service APIs.
 * Uses RestTemplate with Eureka-resolved URLs.
 */
@Slf4j
@RequiredArgsConstructor
public class UserServiceSalClient {

    private final RestTemplate restTemplate;
    private final String baseUrl; // e.g., "http://user-service"

    public UserDto getUserByEmail(String email) {
        log.debug("SAL: Fetching user by email: {}", email);
        return restTemplate.getForObject(
                baseUrl + "/internal/users/by-email?email={email}",
                UserDto.class, email);
    }

    public UserDto getUserById(Long userId) {
        log.debug("SAL: Fetching user by id: {}", userId);
        return restTemplate.getForObject(
                baseUrl + "/internal/users/by-id?userId={userId}",
                UserDto.class, userId);
    }

    public ProfileCompletionStatusDTO getProfileCompletion(String email) {
        log.debug("SAL: Checking profile completion for: {}", email);
        return restTemplate.getForObject(
                baseUrl + "/internal/users/{email}/profile-completion",
                ProfileCompletionStatusDTO.class, email);
    }

    public Boolean isProfileCompleteForNutrition(String email) {
        log.debug("SAL: Checking nutrition readiness for: {}", email);
        return restTemplate.getForObject(
                baseUrl + "/internal/users/{email}/profile-complete-for-nutrition",
                Boolean.class, email);
    }
}
