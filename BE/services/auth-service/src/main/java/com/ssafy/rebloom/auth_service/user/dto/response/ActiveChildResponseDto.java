package com.ssafy.rebloom.auth_service.user.dto.response;

import java.util.UUID;

public record ActiveChildResponseDto(
    UUID userId,
    String name
) {
}