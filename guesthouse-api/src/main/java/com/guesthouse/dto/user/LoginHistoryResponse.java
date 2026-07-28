package com.guesthouse.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginHistoryResponse {
    private UUID id;
    private UUID userId;
    private String attemptedEmail;
    private String action;
    private String status;
    private String failureReason;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
}
