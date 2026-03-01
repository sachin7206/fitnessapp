package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.WellnessTip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WellnessTipRepository extends JpaRepository<WellnessTip, Long> {
    Optional<WellnessTip> findByDayNumber(Integer dayNumber);
}

