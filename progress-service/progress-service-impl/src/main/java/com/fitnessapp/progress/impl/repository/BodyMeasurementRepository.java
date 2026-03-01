package com.fitnessapp.progress.impl.repository;

import com.fitnessapp.progress.impl.model.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {
    List<BodyMeasurement> findByUserEmailAndMeasurementDateAfterOrderByMeasurementDateDesc(String email, LocalDate after);
    Optional<BodyMeasurement> findTopByUserEmailOrderByMeasurementDateDesc(String email);
}

