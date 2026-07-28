package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_status_history")
@Getter
@Setter
public class RoomStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "previous_operational_status")
    private String previousOperationalStatus;

    @Column(name = "new_operational_status")
    private String newOperationalStatus;

    @Column(name = "previous_housekeeping_status")
    private String previousHousekeepingStatus;

    @Column(name = "new_housekeeping_status")
    private String newHousekeepingStatus;

    @Column(name = "changed_by")
    private UUID changedBy;

    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
