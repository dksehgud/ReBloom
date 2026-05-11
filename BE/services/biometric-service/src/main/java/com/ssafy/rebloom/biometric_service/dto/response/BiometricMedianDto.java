package com.ssafy.rebloom.biometric_service.dto.response;

import java.time.LocalDate;

public record BiometricMedianDto(
    LocalDate date,
    Double value
) {
}