package com.guesthouse.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaffDto {
    private UUID id;
    private String email;
    private String displayName;
    private String status;
    private List<String> roles;
}
