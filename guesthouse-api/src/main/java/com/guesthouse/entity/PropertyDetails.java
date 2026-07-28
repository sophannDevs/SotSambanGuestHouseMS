package com.guesthouse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "property_details")
@Getter
@Setter
public class PropertyDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false, unique = true)
    private UUID propertyId;

    @Column(name = "address_line")
    private String addressLine;

    private String city;
    private String province;
    private String country = "Cambodia";

    @Column(name = "postal_code")
    private String postalCode;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Column(name = "default_check_in_time", nullable = false)
    private LocalTime defaultCheckInTime = LocalTime.of(14, 0);

    @Column(name = "default_check_out_time", nullable = false)
    private LocalTime defaultCheckOutTime = LocalTime.of(12, 0);

    @Column(name = "tax_id_number")
    private String taxIdNumber;

    @Column(name = "business_registration_number")
    private String businessRegistrationNumber;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "legal_name")
    private String legalName;

    @Column(name = "billing_address")
    private String billingAddress;

    @Column(name = "bank_details")
    private String bankDetails;

    @Column(name = "invoice_footer_note")
    private String invoiceFooterNote;

    @Column(name = "terms_and_conditions")
    private String termsAndConditions;

    @Column(name = "cancellation_policy")
    private String cancellationPolicy;

    @Column(name = "house_rules")
    private String houseRules;

    @Column(name = "wifi_name")
    private String wifiName;

    @Column(name = "wifi_password")
    private String wifiPassword;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted = false;

    @Column(name = "onboarding_current_step", nullable = false)
    private int onboardingCurrentStep = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
