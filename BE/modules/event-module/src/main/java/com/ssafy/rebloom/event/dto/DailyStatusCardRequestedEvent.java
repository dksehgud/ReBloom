package com.ssafy.rebloom.event.dto;

import java.util.List;
import java.util.UUID;

public record DailyStatusCardRequestedEvent(
    UUID userId,
    String name,
    List<BiometricDataEvent> biometrics,
    List<SleepDataEvent> sleeps
) {
}