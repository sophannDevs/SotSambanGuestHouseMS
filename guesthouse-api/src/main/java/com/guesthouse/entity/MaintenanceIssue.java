package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "maintenance_issues")
@Getter
@Setter
public class MaintenanceIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private String severity = "MEDIUM";

    @Column(nullable = false)
    private String status = "REPORTED";

    @Column(name = "is_blocking", nullable = false)
    private boolean isBlocking = false;

    @Column(name = "reported_by")
    private UUID reportedBy;

    @Column(name = "assigned_staff_id")
    private UUID assignedStaffId;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
