package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.property.*;
import com.guesthouse.entity.*;
import com.guesthouse.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyDetailsRepository propertyDetailsRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final TaxRepository taxRepository;

    public PropertyService(
            PropertyRepository propertyRepository,
            PropertyDetailsRepository propertyDetailsRepository,
            SystemSettingRepository systemSettingRepository,
            TaxRepository taxRepository
    ) {
        this.propertyRepository = propertyRepository;
        this.propertyDetailsRepository = propertyDetailsRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.taxRepository = taxRepository;
    }

    @Transactional(readOnly = true)
    public PropertyResponse getProperty(UUID propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROPERTY_NOT_FOUND));

        PropertyDetails details = propertyDetailsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> createDefaultDetails(propertyId));

        return mapToResponse(property, details);
    }

    @Transactional
    public PropertyResponse updateProperty(UUID propertyId, UpdatePropertyRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROPERTY_NOT_FOUND));

        PropertyDetails details = propertyDetailsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> createDefaultDetails(propertyId));

        if (request.getName() != null) property.setName(request.getName());
        if (request.getDescription() != null) property.setDescription(request.getDescription());
        if (request.getTimezone() != null) property.setTimezone(request.getTimezone());
        if (request.getCurrency() != null) property.setCurrency(request.getCurrency());
        propertyRepository.save(property);

        if (request.getAddressLine() != null) details.setAddressLine(request.getAddressLine());
        if (request.getCity() != null) details.setCity(request.getCity());
        if (request.getProvince() != null) details.setProvince(request.getProvince());
        if (request.getCountry() != null) details.setCountry(request.getCountry());
        if (request.getPostalCode() != null) details.setPostalCode(request.getPostalCode());
        if (request.getLatitude() != null) details.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) details.setLongitude(request.getLongitude());

        if (request.getDefaultCheckInTime() != null) details.setDefaultCheckInTime(request.getDefaultCheckInTime());
        if (request.getDefaultCheckOutTime() != null) details.setDefaultCheckOutTime(request.getDefaultCheckOutTime());

        if (request.getTaxIdNumber() != null) details.setTaxIdNumber(request.getTaxIdNumber());
        if (request.getBusinessRegistrationNumber() != null) details.setBusinessRegistrationNumber(request.getBusinessRegistrationNumber());
        if (request.getLogoUrl() != null) details.setLogoUrl(request.getLogoUrl());
        if (request.getCoverImageUrl() != null) details.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getLegalName() != null) details.setLegalName(request.getLegalName());
        if (request.getBillingAddress() != null) details.setBillingAddress(request.getBillingAddress());
        if (request.getBankDetails() != null) details.setBankDetails(request.getBankDetails());
        if (request.getInvoiceFooterNote() != null) details.setInvoiceFooterNote(request.getInvoiceFooterNote());

        if (request.getTermsAndConditions() != null) details.setTermsAndConditions(request.getTermsAndConditions());
        if (request.getCancellationPolicy() != null) details.setCancellationPolicy(request.getCancellationPolicy());
        if (request.getHouseRules() != null) details.setHouseRules(request.getHouseRules());

        if (request.getWifiName() != null) details.setWifiName(request.getWifiName());
        if (request.getWifiPassword() != null) details.setWifiPassword(request.getWifiPassword());
        if (request.getEmergencyContact() != null) details.setEmergencyContact(request.getEmergencyContact());

        PropertyDetails savedDetails = propertyDetailsRepository.save(details);
        return mapToResponse(property, savedDetails);
    }

    @Transactional(readOnly = true)
    public List<SystemSettingDto> getSettings(UUID propertyId, String category) {
        List<SystemSetting> settings = (category != null && !category.isBlank())
                ? systemSettingRepository.findByPropertyIdAndCategory(propertyId, category)
                : systemSettingRepository.findByPropertyId(propertyId);

        return settings.stream()
                .map(s -> new SystemSettingDto(s.getCategory(), s.getSettingKey(), s.getSettingValue(), s.getValueType()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveSettings(UUID propertyId, List<SystemSettingDto> dtos) {
        for (SystemSettingDto dto : dtos) {
            Optional<SystemSetting> existing = systemSettingRepository.findByPropertyIdAndSettingKey(propertyId, dto.getSettingKey());
            SystemSetting setting = existing.orElseGet(SystemSetting::new);
            setting.setPropertyId(propertyId);
            setting.setCategory(dto.getCategory() != null ? dto.getCategory() : "GENERAL");
            setting.setSettingKey(dto.getSettingKey());
            setting.setSettingValue(dto.getSettingValue());
            setting.setValueType(dto.getValueType() != null ? dto.getValueType() : "STRING");
            systemSettingRepository.save(setting);
        }
    }

    @Transactional(readOnly = true)
    public List<TaxDto> getTaxes(UUID propertyId) {
        return taxRepository.findByPropertyId(propertyId).stream()
                .map(t -> new TaxDto(t.getId(), t.getName(), t.getRatePercentage(), t.isAppliesToServiceCharge(), t.isActive()))
                .collect(Collectors.toList());
    }

    @Transactional
    public TaxDto saveTax(UUID propertyId, TaxDto dto) {
        Tax tax = (dto.getId() != null)
                ? taxRepository.findById(dto.getId()).orElse(new Tax())
                : new Tax();

        tax.setPropertyId(propertyId);
        tax.setName(dto.getName());
        tax.setRatePercentage(dto.getRatePercentage());
        tax.setAppliesToServiceCharge(dto.isAppliesToServiceCharge());
        tax.setActive(dto.isActive());

        Tax saved = taxRepository.save(tax);
        return new TaxDto(saved.getId(), saved.getName(), saved.getRatePercentage(), saved.isAppliesToServiceCharge(), saved.isActive());
    }

    private PropertyDetails createDefaultDetails(UUID propertyId) {
        PropertyDetails details = new PropertyDetails();
        details.setPropertyId(propertyId);
        return propertyDetailsRepository.save(details);
    }

    private PropertyResponse mapToResponse(Property property, PropertyDetails details) {
        return new PropertyResponse(
                property.getId(),
                property.getName(),
                property.getCode(),
                property.getDescription(),
                property.getTimezone(),
                property.getCurrency(),
                details.getAddressLine(),
                details.getCity(),
                details.getProvince(),
                details.getCountry(),
                details.getPostalCode(),
                details.getLatitude(),
                details.getLongitude(),
                details.getDefaultCheckInTime(),
                details.getDefaultCheckOutTime(),
                details.getTaxIdNumber(),
                details.getBusinessRegistrationNumber(),
                details.getLogoUrl(),
                details.getCoverImageUrl(),
                details.getLegalName(),
                details.getBillingAddress(),
                details.getBankDetails(),
                details.getInvoiceFooterNote(),
                details.getTermsAndConditions(),
                details.getCancellationPolicy(),
                details.getHouseRules(),
                details.getWifiName(),
                details.getWifiPassword(),
                details.getEmergencyContact(),
                details.isOnboardingCompleted(),
                details.getOnboardingCurrentStep()
        );
    }
}
