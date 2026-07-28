package com.guesthouse.service;

import com.guesthouse.dto.onboarding.OnboardingStatusResponse;
import com.guesthouse.entity.PropertyDetails;
import com.guesthouse.repository.PropertyDetailsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OnboardingService {

    private final PropertyDetailsRepository propertyDetailsRepository;

    public OnboardingService(PropertyDetailsRepository propertyDetailsRepository) {
        this.propertyDetailsRepository = propertyDetailsRepository;
    }

    @Transactional(readOnly = true)
    public OnboardingStatusResponse getStatus(UUID propertyId) {
        PropertyDetails details = propertyDetailsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> {
                    PropertyDetails d = new PropertyDetails();
                    d.setPropertyId(propertyId);
                    return propertyDetailsRepository.save(d);
                });

        int currentStep = details.getOnboardingCurrentStep();
        int progress = (int) Math.round((currentStep / 14.0) * 100);

        return new OnboardingStatusResponse(details.isOnboardingCompleted(), currentStep, 14, Math.min(progress, 100));
    }

    @Transactional
    public OnboardingStatusResponse updateStep(UUID propertyId, int step) {
        PropertyDetails details = propertyDetailsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> {
                    PropertyDetails d = new PropertyDetails();
                    d.setPropertyId(propertyId);
                    return d;
                });

        details.setOnboardingCurrentStep(Math.min(Math.max(step, 1), 14));
        propertyDetailsRepository.save(details);

        return getStatus(propertyId);
    }

    @Transactional
    public OnboardingStatusResponse completeOnboarding(UUID propertyId) {
        PropertyDetails details = propertyDetailsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> {
                    PropertyDetails d = new PropertyDetails();
                    d.setPropertyId(propertyId);
                    return d;
                });

        details.setOnboardingCompleted(true);
        details.setOnboardingCurrentStep(14);
        propertyDetailsRepository.save(details);

        return getStatus(propertyId);
    }
}
