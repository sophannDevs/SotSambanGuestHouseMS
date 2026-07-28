package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.operations.HousekeepingTaskDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.OperationsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/housekeeping")
public class HousekeepingController {

    private final OperationsService operationsService;

    public HousekeepingController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasAuthority('housekeeping:view')")
    public ResponseEntity<ApiResponse<List<HousekeepingTaskDto>>> getTasks(@AuthenticationPrincipal UserPrincipal principal) {
        List<HousekeepingTaskDto> tasks = operationsService.getHousekeepingTasks(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PutMapping("/tasks/{id}/status")
    @PreAuthorize("hasAuthority('housekeeping:update')")
    public ResponseEntity<ApiResponse<HousekeepingTaskDto>> updateTaskStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam String status
    ) {
        HousekeepingTaskDto updated = operationsService.updateHousekeepingTaskStatus(principal.getPropertyId(), id, status, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Task status updated successfully", updated));
    }
}
