package com.guesthouse.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private UUID propertyId;
    private String email;
    private String displayName;
    private String phone;
    private String avatarUrl;
    private String preferredLanguage;
    private String theme;
    private String status;
    private Instant lastLoginAt;
    private String lastLoginIp;
    private Set<String> roles;
    private Set<String> permissions;
}
