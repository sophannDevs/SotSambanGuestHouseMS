package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.reservation.CalendarTimelineDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.ReservationService;
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
    private final ReservationService reservationService;

    public CalendarController(RoomService roomService, ReservationService reservationService) {
        this.roomService = roomService;
        this.reservationService = reservationService;
    }

    @GetMapping("/timeline")
    @PreAuthorize("hasAuthority('reservation:view')")
    public ResponseEntity<ApiResponse<CalendarTimelineDto>> getTimeline(@AuthenticationPrincipal UserPrincipal principal) {
        CalendarTimelineDto timeline = new CalendarTimelineDto(
                roomService.getRooms(principal.getPropertyId(), null),
                reservationService.getReservations(principal.getPropertyId())
        );
        return ResponseEntity.ok(ApiResponse.ok(timeline));
    }
}
