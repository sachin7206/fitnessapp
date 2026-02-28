package com.fitnessapp.nutrition.impl.repository;

import com.fitnessapp.nutrition.impl.model.UserFoodPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserFoodPreferenceRepository extends JpaRepository<UserFoodPreference, Long> {
    Optional<UserFoodPreference> findByUserId(Long userId);
}

