package com.ssafy.rebloom.auth_service.user.dto.response;

import java.util.List;

public record CounselorChildrenResponseDto(
    List<CounselorChildResponseDto> childrenList
) {
}
