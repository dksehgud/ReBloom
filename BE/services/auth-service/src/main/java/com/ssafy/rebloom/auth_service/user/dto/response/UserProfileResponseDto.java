package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ssafy.rebloom.auth_service.user.domain.entity.Counselor;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileResponseDto(
    String email,
    String name,
    UserRole userRole,
    String hospitalName
) {

    public static UserProfileResponseDto from(User user) {
        return new UserProfileResponseDto(
            user.getEmail(),
            user.getName(),
            user.getRole(),
            user instanceof Counselor counselor ? counselor.getHospitalName() : null
        );
    }
}
