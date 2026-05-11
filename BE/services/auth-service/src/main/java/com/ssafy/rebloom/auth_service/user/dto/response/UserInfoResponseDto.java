package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.ssafy.rebloom.auth_service.user.domain.enums.Gender;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserStatus;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;

@Builder
@JsonInclude(Include.NON_NULL)
public record UserInfoResponseDto(
    UUID userId,
    String email,
    String name,
    String phone,
    UserRole role,
    UserStatus status,

    // PARENT
    String parentCode,

    // CHILDREN
    String birth,
    Gender gender,
    String address,
    String addressDetail,
    BigDecimal latitude,
    BigDecimal longitude,

    // COUNSELOR
    String hospitalName,
    String hospitalAddress
) {
}
