package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "expenses")
@Getter
@Setter
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "expense_number", nullable = false)
    private String expenseNumber;

    @Column(nullable = false)
    private String category = "OTHER";

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate = LocalDate.now();

    private String vendor;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod = "CASH";

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus = "APPROVED";

    @Column(name = "approved_by")
    private UUID approvedBy;

    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;
}
