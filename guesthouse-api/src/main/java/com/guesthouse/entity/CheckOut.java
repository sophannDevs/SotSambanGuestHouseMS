package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "check_outs")
@Getter
@Setter
public class CheckOut {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "guest_id", nullable = false)
    private UUID guestId;

    @Column(name = "key_returned", nullable = false)
    private boolean keyReturned = true;

    private String notes;

    @Column(name = "check_out_time", nullable = false, updatable = false)
    private Instant checkOutTime = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;
}
