package com.guesthouse.dto.room;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AmenityDto {
    private UUID id;
    private String category;
    private String name;
    private String iconName;
    private boolean isGlobal;
}
