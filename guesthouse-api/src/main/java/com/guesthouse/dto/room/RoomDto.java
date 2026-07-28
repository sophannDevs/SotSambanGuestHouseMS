package com.guesthouse.dto.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private UUID id;

    @NotNull(message = "Room type ID is required")
    private UUID roomTypeId;

    private String roomTypeName;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    private String roomName;
    private Integer floor = 1;
    private String building = "Main";
    private Integer maxOccupancy = 2;

    private String operationalStatus = "AVAILABLE";
    private String housekeepingStatus = "CLEAN";
    private String derivedStatus; // Computed single status badge per business-rules.md

    private String notes;
    private Integer sortOrder = 0;
    private boolean isActive = true;
}
