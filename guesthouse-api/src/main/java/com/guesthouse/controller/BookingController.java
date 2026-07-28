package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.booking.CreateBookingRequest;
import com.guesthouse.dto.booking.BookingDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('booking:view')")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getBookings(@AuthenticationPrincipal UserPrincipal principal) {
        List<BookingDto> bookings = bookingService.getBookings(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(bookings));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('booking:view')")
    public ResponseEntity<ApiResponse<BookingDto>> getBooking(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        BookingDto booking = bookingService.getBooking(principal.getPropertyId(), id);
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('booking:edit')")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        BookingDto created = bookingService.createBooking(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Booking created successfully", created));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('booking:cancel')")
    public ResponseEntity<ApiResponse<BookingDto>> cancelBooking(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String reason
    ) {
        BookingDto cancelled = bookingService.updateStatus(principal.getPropertyId(), id, "CANCELLED", principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled successfully", cancelled));
    }
}
