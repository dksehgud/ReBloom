package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PasswordVerifyRequestDto(

    @NotBlank
    String password
) {
}
