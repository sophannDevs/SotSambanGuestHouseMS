package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.booking.CalendarTimelineDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.BookingService;
import com.guesthouse.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/calendar")
public class CalendarController {

    private final RoomService roomService;
    private final BookingService bookingService;

    public CalendarController(RoomService roomService, BookingService bookingService) {
        this.roomService = roomService;
        this.bookingService = bookingService;
    }

    @GetMapping("/timeline")
    @PreAuthorize("hasAuthority('booking:view')")
    public ResponseEntity<ApiResponse<CalendarTimelineDto>> getTimeline(@AuthenticationPrincipal UserPrincipal principal) {
        CalendarTimelineDto timeline = new CalendarTimelineDto(
                roomService.getRooms(principal.getPropertyId(), null),
                bookingService.getBookings(principal.getPropertyId())
        );
        return ResponseEntity.ok(ApiResponse.ok(timeline));
    }
}
