package com.guesthouse.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    private String phone;
    private String avatarUrl;
    private String preferredLanguage;
    private String theme;
}
