package com.guesthouse.dto.property;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {
    private UUID id;
    private String name;
    private String code;
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

    private boolean onboardingCompleted;
    private int onboardingCurrentStep;
}
