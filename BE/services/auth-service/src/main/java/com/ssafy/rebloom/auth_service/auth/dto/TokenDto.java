package com.ssafy.rebloom.auth_service.auth.dto;

public record TokenDto(
    String accessToken,
    String refreshToken
) {

    public static TokenDto from(String accessToken, String refreshToken) {
        return new TokenDto(accessToken, refreshToken);
    }
}
