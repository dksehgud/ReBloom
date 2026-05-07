package com.ssafy.rebloom.auth_service.user.dto.response;

import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;

public record UserProfileResponseDto(
    String email,
    String name,
    UserRole userRole,
    String code
) {

    public static UserProfileResponseDto from(User user) {
        return new UserProfileResponseDto(
            user.getEmail(),
            user.getName(),
            user.getRole(),
            user.getCode()
        );
    }
}
