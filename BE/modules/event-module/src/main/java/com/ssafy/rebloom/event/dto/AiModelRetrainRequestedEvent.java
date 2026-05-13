package com.ssafy.rebloom.event.dto;

import java.util.List;
import java.util.UUID;

public record AiModelRetrainRequestedEvent(
    UUID userId,
    Integer age,
    List<BiometricDataEvent> biometrics,
    List<SleepDataEvent> sleeps
) {
}
