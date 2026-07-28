package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import com.guesthouse.dto.staff.StaffDto;
import com.guesthouse.entity.User;
import com.guesthouse.repository.UserRepository;
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
@RequestMapping("/api/v1/staff")
public class StaffController {

    private final UserRepository userRepository;

    public StaffController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('staff:view')")
    public ResponseEntity<ApiResponse<List<StaffDto>>> getStaff(@AuthenticationPrincipal UserPrincipal principal) {
        List<User> users = userRepository.findAll();
        List<StaffDto> staffList = users.stream()
                .map(u -> new StaffDto(
                        u.getId(),
                        u.getEmail(),
                        u.getDisplayName(),
                        u.getStatus(),
                        u.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList())
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(staffList));
    }
}
