package com.ssafy.rebloom.auth_service.auth.dto;

public record TokenDto(
    String accessToken,
    String refreshToken,
    Long timeout
) {

    public static TokenDto from(String accessToken, String refreshToken, Long timeout) {
        return new TokenDto(accessToken, refreshToken, timeout);
    }
}
