package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.room.RoomTypeDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.RoomTypeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/room-types")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    public RoomTypeController(RoomTypeService roomTypeService) {
        this.roomTypeService = roomTypeService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('room:view')")
    public ResponseEntity<ApiResponse<List<RoomTypeDto>>> getRoomTypes(@AuthenticationPrincipal UserPrincipal principal) {
        List<RoomTypeDto> roomTypes = roomTypeService.getRoomTypes(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(roomTypes));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('room:edit')")
    public ResponseEntity<ApiResponse<RoomTypeDto>> createRoomType(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RoomTypeDto dto
    ) {
        RoomTypeDto created = roomTypeService.createRoomType(principal.getPropertyId(), dto, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Room type created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('room:edit')")
    public ResponseEntity<ApiResponse<RoomTypeDto>> updateRoomType(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody RoomTypeDto dto
    ) {
        RoomTypeDto updated = roomTypeService.updateRoomType(principal.getPropertyId(), id, dto, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Room type updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('room:edit')")
    public ResponseEntity<ApiResponse<Void>> deleteRoomType(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        roomTypeService.deleteRoomType(principal.getPropertyId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Room type deleted successfully", null));
    }
}
