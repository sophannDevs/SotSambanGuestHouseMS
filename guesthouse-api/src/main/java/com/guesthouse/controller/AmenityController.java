package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.room.AmenityDto;
import com.guesthouse.repository.AmenityRepository;
import com.guesthouse.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/amenities")
public class AmenityController {

    private final AmenityRepository amenityRepository;

    public AmenityController(AmenityRepository amenityRepository) {
        this.amenityRepository = amenityRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('room:view')")
    public ResponseEntity<ApiResponse<List<AmenityDto>>> getAmenities(@AuthenticationPrincipal UserPrincipal principal) {
        List<AmenityDto> dtos = amenityRepository.findByPropertyIdOrIsGlobalTrue(principal.getPropertyId()).stream()
                .map(a -> new AmenityDto(a.getId(), a.getCategory(), a.getName(), a.getIconName(), a.isGlobal()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }
}
