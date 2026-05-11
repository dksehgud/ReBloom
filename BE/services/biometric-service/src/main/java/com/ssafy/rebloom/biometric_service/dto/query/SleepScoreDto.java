package com.ssafy.rebloom.biometric_service.dto.query;

import java.time.LocalDate;

public record SleepScoreDto(
    LocalDate date,
    Double score
) {
}
