package com.fitnessapp.nutrition.impl.repository;

import com.fitnessapp.nutrition.impl.model.FoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {
    List<FoodLog> findByUserEmailAndLogDateOrderByCreatedAtDesc(String userEmail, LocalDate logDate);
    List<FoodLog> findByUserEmailAndLogDateAfterOrderByLogDateDescCreatedAtDesc(String userEmail, LocalDate afterDate);
}

