package com.guesthouse.dto.frontdesk;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CheckInRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotNull(message = "Room ID is required")
    private UUID roomId;

    private String keyNumber;
    private boolean houseRulesAccepted = true;
    private String vehiclePlate;
    private String notes;
}
