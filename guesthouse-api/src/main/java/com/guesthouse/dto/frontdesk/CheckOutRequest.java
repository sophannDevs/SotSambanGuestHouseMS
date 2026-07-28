package com.guesthouse.dto.frontdesk;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CheckOutRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    private boolean keyReturned = true;
    private String notes;
}
