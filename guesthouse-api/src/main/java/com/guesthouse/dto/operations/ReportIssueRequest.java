package com.guesthouse.dto.operations;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReportIssueRequest {

    @NotNull(message = "Room ID is required")
    private UUID roomId;

    @NotBlank(message = "Issue title is required")
    private String title;

    private String description;
    private String severity = "MEDIUM";
    private boolean isBlocking = false;
}
