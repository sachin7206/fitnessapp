package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.CustomWorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomWorkoutLogRepository extends JpaRepository<CustomWorkoutLog, Long> {

    Optional<CustomWorkoutLog> findByUserEmailAndLogDateAndDayOfWeekAndExerciseIndex(
            String userEmail, LocalDate logDate, String dayOfWeek, Integer exerciseIndex);

    List<CustomWorkoutLog> findByUserEmailAndLogDateBetweenOrderByLogDateDesc(
            String userEmail, LocalDate start, LocalDate end);

    List<CustomWorkoutLog> findByUserEmailAndLogDate(String userEmail, LocalDate logDate);

    @Modifying
    @Query("DELETE FROM CustomWorkoutLog c WHERE c.userEmail = :userEmail")
    void deleteByUserEmail(String userEmail);
}

