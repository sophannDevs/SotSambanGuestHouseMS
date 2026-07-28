package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "check_ins")
@Getter
@Setter
public class CheckIn {

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

    @Column(name = "key_number")
    private String keyNumber;

    @Column(name = "house_rules_accepted", nullable = false)
    private boolean houseRulesAccepted = true;

    @Column(name = "vehicle_plate")
    private String vehiclePlate;

    private String notes;

    @Column(name = "check_in_time", nullable = false, updatable = false)
    private Instant checkInTime = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;
}
