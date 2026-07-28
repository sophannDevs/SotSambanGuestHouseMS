package com.guesthouse.dto.reservation;

import com.guesthouse.dto.guest.GuestDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDto {
    private UUID id;
    private String reservationNumber;

    private GuestDto mainGuest;
    private UUID roomTypeId;
    private String roomTypeName;
    private UUID assignedRoomId;
    private String assignedRoomNumber;

    private LocalDate arrivalDate;
    private LocalDate departureDate;
    private Integer totalNights;
    private Integer adults;
    private Integer children;

    private BigDecimal baseRate;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceDue;

    private String reservationStatus;
    private String paymentStatus;
    private String source;
    private String externalReference;
    private String specialRequests;
    private String internalNotes;
    private Long version;
}
