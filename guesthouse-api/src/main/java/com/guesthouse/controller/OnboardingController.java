package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.onboarding.OnboardingStatusResponse;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.OnboardingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('onboarding:manage')")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> getStatus(@AuthenticationPrincipal UserPrincipal principal) {
        OnboardingStatusResponse status = onboardingService.getStatus(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @PutMapping("/step/{step}")
    @PreAuthorize("hasAuthority('onboarding:manage')")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> updateStep(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable int step
    ) {
        OnboardingStatusResponse status = onboardingService.updateStep(principal.getPropertyId(), step);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @PostMapping("/complete")
    @PreAuthorize("hasAuthority('onboarding:manage')")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> completeOnboarding(@AuthenticationPrincipal UserPrincipal principal) {
        OnboardingStatusResponse status = onboardingService.completeOnboarding(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok("Onboarding completed successfully", status));
    }
}
