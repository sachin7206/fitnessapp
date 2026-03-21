package com.fitnessapp.payment.impl.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;


    @Column(name = "subscription_id")
    private Long subscriptionId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod; // UPI, QR_CODE

    @Column(nullable = false)
    private String status; // PENDING, SUCCESS, FAILED, REFUNDED

    @Column(name = "transaction_ref")
    private String transactionRef;

    @Column(name = "upi_id")
    private String upiId;

    @Column(name = "merchant_upi_id")
    private String merchantUpiId;

    @Column(name = "merchant_name")
    private String merchantName;

    private String description;

    @Column(name = "payment_gateway")
    private String paymentGateway; // RAZORPAY, MANUAL_UPI

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    private String gatewayResponse;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (currency == null) currency = "INR";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
