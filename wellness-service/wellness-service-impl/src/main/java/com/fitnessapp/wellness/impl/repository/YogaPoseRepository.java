package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface YogaPoseRepository extends JpaRepository<YogaPose, Long> {
    List<YogaPose> findByDifficulty(String difficulty);
}

