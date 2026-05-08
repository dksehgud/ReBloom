package com.ssafy.rebloom.auth_service.user.dto.response;

import java.util.UUID;

public record ParentSummaryResponseDto(
    UUID parentId,
    String name,
    String email
) {
}
