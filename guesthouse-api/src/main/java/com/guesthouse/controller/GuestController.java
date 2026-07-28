package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.guest.GuestDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.GuestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/guests")
public class GuestController {

    private final GuestService guestService;

    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('guest:view')")
    public ResponseEntity<ApiResponse<List<GuestDto>>> getGuests(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String query
    ) {
        List<GuestDto> guests = guestService.getGuests(principal.getPropertyId(), query);
        return ResponseEntity.ok(ApiResponse.ok(guests));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('guest:edit')")
    public ResponseEntity<ApiResponse<GuestDto>> createGuest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GuestDto dto
    ) {
        GuestDto created = guestService.createGuest(principal.getPropertyId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Guest created successfully", created));
    }
}
