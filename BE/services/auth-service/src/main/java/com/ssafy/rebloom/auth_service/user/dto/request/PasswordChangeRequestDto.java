package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequestDto(

    @NotBlank
    String newPassword
) {
}
