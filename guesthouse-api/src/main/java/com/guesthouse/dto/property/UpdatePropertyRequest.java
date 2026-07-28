package com.guesthouse.dto.property;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
public class UpdatePropertyRequest {

    @NotBlank(message = "Property name is required")
    private String name;

    private String description;
    private String timezone;
    private String currency;

    private String addressLine;
    private String city;
    private String province;
    private String country;
    private String postalCode;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private LocalTime defaultCheckInTime;
    private LocalTime defaultCheckOutTime;

    private String taxIdNumber;
    private String businessRegistrationNumber;
    private String logoUrl;
    private String coverImageUrl;
    private String legalName;
    private String billingAddress;
    private String bankDetails;
    private String invoiceFooterNote;

    private String termsAndConditions;
    private String cancellationPolicy;
    private String houseRules;

    private String wifiName;
    private String wifiPassword;
    private String emergencyContact;
}
