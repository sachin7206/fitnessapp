package com.fitnessapp.progress.impl.repository;

import com.fitnessapp.progress.impl.model.ProgressGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProgressGoalRepository extends JpaRepository<ProgressGoal, Long> {
    List<ProgressGoal> findByUserIdAndIsActiveTrue(Long userId);
    List<ProgressGoal> findByUserIdAndGoalTypeAndIsActiveTrue(Long userId, String goalType);
}
