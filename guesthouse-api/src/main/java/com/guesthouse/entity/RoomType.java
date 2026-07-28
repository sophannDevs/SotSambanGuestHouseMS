package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "room_types")
@Getter
@Setter
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    private String description;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Column(name = "extra_bed_price", nullable = false)
    private BigDecimal extraBedPrice = BigDecimal.ZERO;

    @Column(name = "extra_person_price", nullable = false)
    private BigDecimal extraPersonPrice = BigDecimal.ZERO;

    @Column(name = "cleaning_fee", nullable = false)
    private BigDecimal cleaningFee = BigDecimal.ZERO;

    @Column(name = "default_deposit", nullable = false)
    private BigDecimal defaultDeposit = BigDecimal.ZERO;

    @Column(name = "max_adults", nullable = false)
    private Integer maxAdults = 2;

    @Column(name = "max_children", nullable = false)
    private Integer maxChildren = 1;

    @Column(name = "bed_count", nullable = false)
    private Integer bedCount = 1;

    @Column(name = "bed_type", nullable = false)
    private String bedType = "DOUBLE";

    @Column(name = "room_size_sqm")
    private BigDecimal roomSizeSqm;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "room_type_amenities",
        joinColumns = @JoinColumn(name = "room_type_id"),
        inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private Set<Amenity> amenities = new HashSet<>();
}
