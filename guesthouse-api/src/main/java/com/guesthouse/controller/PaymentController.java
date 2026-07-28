package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.payment.InvoiceDto;
import com.guesthouse.dto.payment.PaymentDto;
import com.guesthouse.dto.payment.RecordPaymentRequest;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAuthority('payment:view')")
    public ResponseEntity<ApiResponse<List<PaymentDto>>> getPayments(@AuthenticationPrincipal UserPrincipal principal) {
        List<PaymentDto> payments = paymentService.getPayments(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAuthority('payment:create')")
    public ResponseEntity<ApiResponse<PaymentDto>> recordPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RecordPaymentRequest request
    ) {
        PaymentDto payment = paymentService.recordPayment(principal.getPropertyId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Payment recorded successfully", payment));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('invoice:view')")
    public ResponseEntity<ApiResponse<List<InvoiceDto>>> getInvoices(@AuthenticationPrincipal UserPrincipal principal) {
        List<InvoiceDto> invoices = paymentService.getInvoices(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(invoices));
    }
}
