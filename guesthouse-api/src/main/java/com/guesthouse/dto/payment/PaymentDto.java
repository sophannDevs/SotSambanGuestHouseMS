package com.guesthouse.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private UUID id;
    private String paymentNumber;
    private UUID reservationId;
    private String reservationNumber;
    private String guestName;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentKind;
    private String status;
    private String transactionReference;
    private Instant paymentTime;
}
