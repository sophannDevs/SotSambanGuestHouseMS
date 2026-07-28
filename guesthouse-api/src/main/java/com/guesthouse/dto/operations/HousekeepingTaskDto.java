package com.guesthouse.dto.operations;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HousekeepingTaskDto {
    private UUID id;
    private UUID roomId;
    private String roomNumber;
    private String taskType;
    private String priority;
    private String status;
    private String notes;
    private LocalDate scheduledDate;
    private Instant completedAt;
}
