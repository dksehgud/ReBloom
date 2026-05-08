package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ParentConnectRequestDto(
    @NotBlank
    String name,

    @NotBlank
    @Email
    String email
) {
}
