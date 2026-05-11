package com.ssafy.rebloom.biometric_service.dto.query;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SleepEfficiencyDto(
    LocalDate date,
    Double efficiency
) {
    public SleepEfficiencyDto(LocalDateTime wakeup, Double efficiency) {
        this(wakeup.toLocalDate(), efficiency);
    }
}