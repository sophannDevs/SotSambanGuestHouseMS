package com.guesthouse.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class RecordPaymentRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotNull(message = "Payment amount is required")
    private BigDecimal amount;

    private String paymentMethod = "CASH";
    private String paymentKind = "PAYMENT";
    private String transactionReference;
    private String notes;
}
