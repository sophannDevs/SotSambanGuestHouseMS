package com.guesthouse.dto.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoomTypeDto {
    private UUID id;

    @NotBlank(message = "Room type name is required")
    private String name;

    @NotBlank(message = "Room type code is required")
    private String code;

    private String description;

    @NotNull(message = "Base price is required")
    private BigDecimal basePrice;

    private BigDecimal extraBedPrice = BigDecimal.ZERO;
    private BigDecimal extraPersonPrice = BigDecimal.ZERO;
    private BigDecimal cleaningFee = BigDecimal.ZERO;
    private BigDecimal defaultDeposit = BigDecimal.ZERO;

    private Integer maxAdults = 2;
    private Integer maxChildren = 1;
    private Integer bedCount = 1;
    private String bedType = "DOUBLE";
    private BigDecimal roomSizeSqm;
    private Integer sortOrder = 0;
    private boolean isActive = true;

    private Set<UUID> amenityIds;
    private Set<AmenityDto> amenities;
}
