package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.MotivationalQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MotivationalQuoteRepository extends JpaRepository<MotivationalQuote, Long> {
}

