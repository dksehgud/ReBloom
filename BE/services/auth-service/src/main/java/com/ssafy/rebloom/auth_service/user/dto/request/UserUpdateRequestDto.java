package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.Email;

public record UserUpdateRequestDto(

    String name,

    @Email
    String email,

    String phone,

    String hospitalName,

    String hospitalAddress
) {
}
