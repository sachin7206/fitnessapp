package com.fitnessapp.payment.impl.repository;

import com.fitnessapp.payment.impl.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<Payment> findBySubscriptionIdOrderByCreatedAtDesc(Long subscriptionId);
    Optional<Payment> findByTransactionRef(String transactionRef);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}


