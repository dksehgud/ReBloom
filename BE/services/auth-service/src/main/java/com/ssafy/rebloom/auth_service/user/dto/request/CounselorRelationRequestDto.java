package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CounselorRelationRequestDto(
    @NotNull
    UUID counselorId
) {
}
