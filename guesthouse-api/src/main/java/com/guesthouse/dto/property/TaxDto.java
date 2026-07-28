package com.guesthouse.dto.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaxDto {
    private UUID id;

    @NotBlank(message = "Tax name is required")
    private String name;

    @NotNull(message = "Rate percentage is required")
    private BigDecimal ratePercentage;

    private boolean appliesToServiceCharge = true;
    private boolean isActive = true;
}
