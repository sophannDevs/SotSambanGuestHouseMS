package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.reservation.CreateReservationRequest;
import com.guesthouse.dto.reservation.ReservationDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('reservation:view')")
    public ResponseEntity<ApiResponse<List<ReservationDto>>> getReservations(@AuthenticationPrincipal UserPrincipal principal) {
        List<ReservationDto> reservations = reservationService.getReservations(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(reservations));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('reservation:view')")
    public ResponseEntity<ApiResponse<ReservationDto>> getReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        ReservationDto reservation = reservationService.getReservation(principal.getPropertyId(), id);
        return ResponseEntity.ok(ApiResponse.ok(reservation));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('reservation:edit')")
    public ResponseEntity<ApiResponse<ReservationDto>> createReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReservationRequest request
    ) {
        ReservationDto created = reservationService.createReservation(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Reservation created successfully", created));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('reservation:cancel')")
    public ResponseEntity<ApiResponse<ReservationDto>> cancelReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String reason
    ) {
        ReservationDto cancelled = reservationService.updateStatus(principal.getPropertyId(), id, "CANCELLED", principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.ok("Reservation cancelled successfully", cancelled));
    }
}
