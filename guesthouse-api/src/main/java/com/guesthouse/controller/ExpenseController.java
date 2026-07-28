package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.expense.CreateExpenseRequest;
import com.guesthouse.dto.expense.ExpenseDto;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('expense:view')")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getExpenses(@AuthenticationPrincipal UserPrincipal principal) {
        List<ExpenseDto> expenses = expenseService.getExpenses(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(expenses));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('expense:create')")
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        ExpenseDto created = expenseService.createExpense(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Expense recorded successfully", created));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('expense:approve')")
    public ResponseEntity<ApiResponse<ExpenseDto>> approveExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        ExpenseDto approved = expenseService.approveExpense(principal.getPropertyId(), id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Expense approved successfully", approved));
    }
}
