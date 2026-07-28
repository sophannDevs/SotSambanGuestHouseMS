package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.property.*;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping("/current")
    @PreAuthorize("hasAuthority('property:view')")
    public ResponseEntity<ApiResponse<PropertyResponse>> getCurrentProperty(@AuthenticationPrincipal UserPrincipal principal) {
        PropertyResponse response = propertyService.getProperty(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/current")
    @PreAuthorize("hasAuthority('property:edit')")
    public ResponseEntity<ApiResponse<PropertyResponse>> updateCurrentProperty(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePropertyRequest request
    ) {
        PropertyResponse response = propertyService.updateProperty(principal.getPropertyId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Property details updated successfully", response));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAuthority('settings:view')")
    public ResponseEntity<ApiResponse<List<SystemSettingDto>>> getSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String category
    ) {
        List<SystemSettingDto> settings = propertyService.getSettings(principal.getPropertyId(), category);
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAuthority('settings:edit')")
    public ResponseEntity<ApiResponse<Void>> updateSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody List<SystemSettingDto> settings
    ) {
        propertyService.saveSettings(principal.getPropertyId(), settings);
        return ResponseEntity.ok(ApiResponse.ok("Settings saved successfully", null));
    }

    @GetMapping("/taxes")
    @PreAuthorize("hasAuthority('settings:view')")
    public ResponseEntity<ApiResponse<List<TaxDto>>> getTaxes(@AuthenticationPrincipal UserPrincipal principal) {
        List<TaxDto> taxes = propertyService.getTaxes(principal.getPropertyId());
        return ResponseEntity.ok(ApiResponse.ok(taxes));
    }

    @PostMapping("/taxes")
    @PreAuthorize("hasAuthority('settings:edit')")
    public ResponseEntity<ApiResponse<TaxDto>> saveTax(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaxDto taxDto
    ) {
        TaxDto saved = propertyService.saveTax(principal.getPropertyId(), taxDto);
        return ResponseEntity.ok(ApiResponse.ok("Tax saved successfully", saved));
    }
}
