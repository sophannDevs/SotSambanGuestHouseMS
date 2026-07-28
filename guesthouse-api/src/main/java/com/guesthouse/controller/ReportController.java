package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.report.FinancialReportDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/financial")
    @PreAuthorize("hasAuthority('report:view')")
    public ResponseEntity<ApiResponse<FinancialReportDto>> getFinancialReport(@AuthenticationPrincipal UserPrincipal principal) {
        FinancialReportDto report = reportService.getFinancialReport(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(report));
    }
}
