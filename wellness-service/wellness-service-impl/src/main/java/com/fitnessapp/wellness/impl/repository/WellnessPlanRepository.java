package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.WellnessPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WellnessPlanRepository extends JpaRepository<WellnessPlan, Long> {}

