package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.frontdesk.CheckInRequest;
import com.guesthouse.dto.frontdesk.CheckOutRequest;
import com.guesthouse.dto.booking.BookingDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.BookingService;
import com.guesthouse.service.FrontDeskService;
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
    private final BookingService bookingService;

    public FrontDeskController(FrontDeskService frontDeskService, BookingService bookingService) {
        this.frontDeskService = frontDeskService;
        this.bookingService = bookingService;
    }

    @GetMapping("/arrivals")
    @PreAuthorize("hasAuthority('booking:view')")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getArrivals(@AuthenticationPrincipal UserPrincipal principal) {
        List<BookingDto> arrivals = bookingService.getBookings(principal.getPropertyId()).stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getBookingStatus()) || "PENDING".equalsIgnoreCase(b.getBookingStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(arrivals));
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('booking:edit')")
    public ResponseEntity<ApiResponse<BookingDto>> checkIn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckInRequest request
    ) {
        BookingDto checkedIn = frontDeskService.executeCheckIn(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Check-in completed successfully", checkedIn));
    }

    @GetMapping("/in-house")
    @PreAuthorize("hasAuthority('booking:view')")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getInHouse(@AuthenticationPrincipal UserPrincipal principal) {
        List<BookingDto> inHouse = bookingService.getBookings(principal.getPropertyId()).stream()
                .filter(b -> "CHECKED_IN".equalsIgnoreCase(b.getBookingStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(inHouse));
    }

    @GetMapping("/departures")
    @PreAuthorize("hasAuthority('booking:view')")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getDepartures(@AuthenticationPrincipal UserPrincipal principal) {
        List<BookingDto> departures = bookingService.getBookings(principal.getPropertyId()).stream()
                .filter(b -> "CHECKED_IN".equalsIgnoreCase(b.getBookingStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(departures));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAuthority('booking:edit')")
    public ResponseEntity<ApiResponse<BookingDto>> checkOut(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckOutRequest request
    ) {
        BookingDto checkedOut = frontDeskService.executeCheckOut(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Check-out completed successfully", checkedOut));
    }
}
