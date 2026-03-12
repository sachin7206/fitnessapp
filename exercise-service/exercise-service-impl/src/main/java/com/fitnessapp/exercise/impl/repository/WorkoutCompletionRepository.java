package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.WorkoutCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WorkoutCompletionRepository extends JpaRepository<WorkoutCompletion, Long> {
    Optional<WorkoutCompletion> findByUserEmailAndCompletionDate(String userEmail, LocalDate completionDate);
    long countByUserEmailAndCompletedTrue(String userEmail);

    @Modifying
    @Query("DELETE FROM WorkoutCompletion w WHERE w.userEmail = :userEmail")
    void deleteByUserEmail(String userEmail);
}

