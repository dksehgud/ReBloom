package com.ssafy.rebloom.biometric_service.dto.response;

import java.util.UUID;

public record ActiveChildResponseDto(
    UUID userId,
    String name
) {
}