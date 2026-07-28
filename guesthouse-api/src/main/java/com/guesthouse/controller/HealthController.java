package com.guesthouse.controller;

import com.guesthouse.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final Clock clock;

    public HealthController(Clock clock) {
        this.clock = clock;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealth() {
        Map<String, Object> healthInfo = Map.of(
                "status", "UP",
                "application", "Guest House Manager API",
                "version", "0.1.0-SNAPSHOT",
                "timestamp", OffsetDateTime.now(clock)
        );
        return ResponseEntity.ok(ApiResponse.ok("Service is healthy", healthInfo));
    }
}
