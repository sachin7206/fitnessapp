package com.fitnessapp.subscription.impl.repository;

import com.fitnessapp.subscription.impl.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    List<Subscription> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Subscription> findByIdAndUserId(Long id, Long userId);
}

