package com.ssafy.rebloom.auth_service.user.dto.response;

import java.util.UUID;

public record CounselorChildResponseDto(
    UUID childrenId,
    String name,
    Integer age,
    String gender,
    String parentName,
    String counselingStatus
) {
}
