package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter
@Setter
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "reservation_id", nullable = false)
    private UUID reservationId;

    @Column(name = "guest_id", nullable = false)
    private UUID guestId;

    @Column(name = "invoice_type", nullable = false)
    private String invoiceType = "STANDARD";

    @Column(nullable = false)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status = "ISSUED";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;
}
