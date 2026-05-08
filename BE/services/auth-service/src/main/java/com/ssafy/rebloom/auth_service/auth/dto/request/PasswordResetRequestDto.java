package com.ssafy.rebloom.auth_service.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequestDto(
    @NotBlank
    @Email
    String email
) {
}
