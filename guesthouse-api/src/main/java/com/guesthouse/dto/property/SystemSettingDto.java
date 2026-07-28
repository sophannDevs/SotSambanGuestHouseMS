package com.guesthouse.dto.property;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingDto {
    private String category;

    @NotBlank(message = "Setting key is required")
    private String settingKey;

    private String settingValue;
    private String valueType = "STRING";
}
