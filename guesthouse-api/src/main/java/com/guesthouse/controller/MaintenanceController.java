package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.operations.MaintenanceIssueDto;
import com.guesthouse.dto.operations.ReportIssueRequest;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.OperationsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/maintenance")
public class MaintenanceController {

    private final OperationsService operationsService;

    public MaintenanceController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/issues")
    @PreAuthorize("hasAuthority('maintenance:view')")
    public ResponseEntity<ApiResponse<List<MaintenanceIssueDto>>> getIssues(@AuthenticationPrincipal UserPrincipal principal) {
        List<MaintenanceIssueDto> issues = operationsService.getMaintenanceIssues(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(issues));
    }

    @PostMapping("/issues")
    @PreAuthorize("hasAuthority('maintenance:create')")
    public ResponseEntity<ApiResponse<MaintenanceIssueDto>> reportIssue(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReportIssueRequest request
    ) {
        MaintenanceIssueDto created = operationsService.reportMaintenanceIssue(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Maintenance issue reported successfully", created));
    }

    @PutMapping("/issues/{id}/resolve")
    @PreAuthorize("hasAuthority('maintenance:complete')")
    public ResponseEntity<ApiResponse<MaintenanceIssueDto>> resolveIssue(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        MaintenanceIssueDto resolved = operationsService.resolveMaintenanceIssue(principal.getPropertyId(), id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Maintenance issue resolved successfully", resolved));
    }
}
