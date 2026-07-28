package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "amenities")
@Getter
@Setter
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id")
    private UUID propertyId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String name;

    @Column(name = "icon_name")
    private String iconName;

    @Column(name = "is_global", nullable = false)
    private boolean isGlobal = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
