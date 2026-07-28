package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "payment_number", nullable = false)
    private String paymentNumber;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "guest_id", nullable = false)
    private UUID guestId;

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod = "CASH";

    @Column(name = "payment_kind", nullable = false)
    private String paymentKind = "PAYMENT";

    @Column(nullable = false)
    private String status = "COMPLETED";

    @Column(name = "transaction_reference")
    private String transactionReference;

    private String notes;

    @Column(name = "payment_time", nullable = false, updatable = false)
    private Instant paymentTime = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;
}
