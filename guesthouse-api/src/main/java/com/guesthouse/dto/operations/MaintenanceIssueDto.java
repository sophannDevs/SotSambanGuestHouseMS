package com.guesthouse.dto.operations;

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
public class MaintenanceIssueDto {
    private UUID id;
    private UUID roomId;
    private String roomNumber;
    private String title;
    private String description;
    private String severity;
    private String status;
    private boolean isBlocking;
    private Instant resolvedAt;
}
