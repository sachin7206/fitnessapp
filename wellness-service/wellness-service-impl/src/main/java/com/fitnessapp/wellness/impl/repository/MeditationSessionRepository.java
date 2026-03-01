package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.MeditationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeditationSessionRepository extends JpaRepository<MeditationSession, Long> {
    List<MeditationSession> findByType(String type);
}

