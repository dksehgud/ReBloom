package com.ssafy.rebloom.biometric_service.dto.query;

import java.time.LocalDate;

public record SleepEfficiencyDto(
    LocalDate date,
    Double efficiency
) {

}