package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ParentCounselorResponseDto(
    UUID counselorId,
    String name,
    String email,
    RelationStatus relationStatus
) {
    public static ParentCounselorResponseDto disconnected() {
        return new ParentCounselorResponseDto(null, null, null, null);
    }
}
