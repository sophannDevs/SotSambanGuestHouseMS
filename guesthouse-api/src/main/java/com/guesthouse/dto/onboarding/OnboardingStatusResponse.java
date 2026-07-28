package com.guesthouse.dto.onboarding;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStatusResponse {
    private boolean completed;
    private int currentStep;
    private int totalSteps = 14;
    private int progressPercentage;
}
