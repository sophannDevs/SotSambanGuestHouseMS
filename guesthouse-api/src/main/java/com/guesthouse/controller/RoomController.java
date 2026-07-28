package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.room.BulkCreateRoomsRequest;
import com.guesthouse.dto.room.RoomBlockDto;
import com.guesthouse.dto.room.RoomDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('room:view')")
    public ResponseEntity<ApiResponse<List<RoomDto>>> getRooms(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Integer floor
    ) {
        List<RoomDto> rooms = roomService.getRooms(principal.getPropertyId(), floor);
        return ResponseEntity.ok(ApiResponse.ok(rooms));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('room:edit')")
    public ResponseEntity<ApiResponse<RoomDto>> createRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RoomDto dto
    ) {
        RoomDto created = roomService.createRoom(principal.getPropertyId(), dto, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Room created successfully", created));
    }

    @PostMapping("/bulk-create")
    @PreAuthorize("hasAuthority('room:edit')")
    public ResponseEntity<ApiResponse<List<RoomDto>>> bulkCreateRooms(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BulkCreateRoomsRequest request
    ) {
        List<RoomDto> created = roomService.bulkCreateRooms(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Rooms created successfully in batch", created));
    }

    @PutMapping("/{id}/housekeeping-status")
    @PreAuthorize("hasAuthority('room:change_status')")
    public ResponseEntity<ApiResponse<RoomDto>> updateHousekeepingStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String reason
    ) {
        RoomDto updated = roomService.updateHousekeepingStatus(principal.getPropertyId(), id, status, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.ok("Housekeeping status updated successfully", updated));
    }

    @PostMapping("/blocks")
    @PreAuthorize("hasAuthority('room:edit')")
    public ResponseEntity<ApiResponse<RoomBlockDto>> blockRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RoomBlockDto dto
    ) {
        RoomBlockDto blocked = roomService.blockRoom(principal.getPropertyId(), dto, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Room blocked successfully", blocked));
    }
}
