package com.guesthouse.dto.onboarding;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class OnboardingStepRequest {
    private int step;
    private boolean skipped = false;
    private Map<String, Object> data;
}
