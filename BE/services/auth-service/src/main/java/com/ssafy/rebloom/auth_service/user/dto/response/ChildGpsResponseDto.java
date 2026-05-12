package com.ssafy.rebloom.auth_service.user.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record ChildGpsResponseDto(
    UUID childId,
    BigDecimal latitude,
    BigDecimal longitude
) {
}
