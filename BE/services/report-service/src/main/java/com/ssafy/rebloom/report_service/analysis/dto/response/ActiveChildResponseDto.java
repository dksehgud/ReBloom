package com.ssafy.rebloom.report_service.analysis.dto.response;

import java.util.UUID;

public record ActiveChildResponseDto(
    UUID userId,
    String name
) {
}
