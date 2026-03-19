package com.fitnessapp.subscription.impl.repository;

import com.fitnessapp.subscription.impl.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findFirstByUserEmailAndStatusOrderByCreatedAtDesc(String userEmail, String status);
    List<Subscription> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    Optional<Subscription> findByIdAndUserEmail(Long id, String userEmail);
}

