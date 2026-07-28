package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.frontdesk.CheckInRequest;
import com.guesthouse.dto.frontdesk.CheckOutRequest;
import com.guesthouse.dto.reservation.ReservationDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.FrontDeskService;
import com.guesthouse.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/front-desk")
public class FrontDeskController {

    private final FrontDeskService frontDeskService;
    private final ReservationService reservationService;

    public FrontDeskController(FrontDeskService frontDeskService, ReservationService reservationService) {
        this.frontDeskService = frontDeskService;
        this.reservationService = reservationService;
    }

    @GetMapping("/arrivals")
    @PreAuthorize("hasAuthority('reservation:view')")
    public ResponseEntity<ApiResponse<List<ReservationDto>>> getArrivals(@AuthenticationPrincipal UserPrincipal principal) {
        List<ReservationDto> arrivals = reservationService.getReservations(principal.getPropertyId()).stream()
                .filter(r -> "CONFIRMED".equalsIgnoreCase(r.getReservationStatus()) || "PENDING".equalsIgnoreCase(r.getReservationStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(arrivals));
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('reservation:edit')")
    public ResponseEntity<ApiResponse<ReservationDto>> checkIn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckInRequest request
    ) {
        ReservationDto checkedIn = frontDeskService.executeCheckIn(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Check-in completed successfully", checkedIn));
    }

    @GetMapping("/in-house")
    @PreAuthorize("hasAuthority('reservation:view')")
    public ResponseEntity<ApiResponse<List<ReservationDto>>> getInHouse(@AuthenticationPrincipal UserPrincipal principal) {
        List<ReservationDto> inHouse = reservationService.getReservations(principal.getPropertyId()).stream()
                .filter(r -> "CHECKED_IN".equalsIgnoreCase(r.getReservationStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(inHouse));
    }

    @GetMapping("/departures")
    @PreAuthorize("hasAuthority('reservation:view')")
    public ResponseEntity<ApiResponse<List<ReservationDto>>> getDepartures(@AuthenticationPrincipal UserPrincipal principal) {
        List<ReservationDto> departures = reservationService.getReservations(principal.getPropertyId()).stream()
                .filter(r -> "CHECKED_IN".equalsIgnoreCase(r.getReservationStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(departures));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAuthority('reservation:edit')")
    public ResponseEntity<ApiResponse<ReservationDto>> checkOut(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckOutRequest request
    ) {
        ReservationDto checkedOut = frontDeskService.executeCheckOut(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Check-out completed successfully", checkedOut));
    }
}
