package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequestDto(

    String currentPassword,

    @NotBlank
    String newPassword,

    String newPasswordConfirm
) {
}
