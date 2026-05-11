package com.ssafy.rebloom.biometric_service.dto.query;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SleepScoreDto(
    LocalDate date,
    Double score
) {
    public SleepScoreDto(LocalDateTime wakeup, Double score) {
        this(wakeup.toLocalDate(), score);
    }
}
