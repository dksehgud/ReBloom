package com.ssafy.rebloom.auth_service.auth.dto;

public record OAuth2SignupInfo(
    String provider,
    String providerUserId,
    String email,
    String name
) {
}
