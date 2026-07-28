package com.guesthouse.dto.room;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class BulkCreateRoomsRequest {

    @NotNull(message = "Room type ID is required")
    private UUID roomTypeId;

    @Min(value = 1, message = "Start number must be at least 1")
    private int startNumber;

    @Min(value = 1, message = "End number must be at least 1")
    private int endNumber;

    private int floor = 1;
    private String building = "Main";
    private String prefix = "";
}
