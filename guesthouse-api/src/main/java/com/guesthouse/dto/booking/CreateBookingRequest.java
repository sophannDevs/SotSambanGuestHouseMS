package com.guesthouse.dto.booking;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class CreateBookingRequest {

    @NotNull(message = "Main guest ID is required")
    private UUID mainGuestId;

    @NotNull(message = "Room type ID is required")
    private UUID roomTypeId;

    private UUID assignedRoomId;

    @NotNull(message = "Arrival date is required")
    private LocalDate arrivalDate;

    @NotNull(message = "Departure date is required")
    private LocalDate departureDate;

    private Integer adults = 1;
    private Integer children = 0;
    private BigDecimal baseRate;
    private String source = "DIRECT_WALK_IN";
    private String specialRequests;
    private String internalNotes;
}
