package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.UserWellnessPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserWellnessPlanRepository extends JpaRepository<UserWellnessPlan, Long> {
    Optional<UserWellnessPlan> findByUserEmailAndStatus(String email, String status);
}

