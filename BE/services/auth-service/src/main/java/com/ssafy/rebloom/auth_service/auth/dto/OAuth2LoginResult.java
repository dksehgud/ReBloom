package com.ssafy.rebloom.auth_service.auth.dto;

public record OAuth2LoginResult(
    boolean registered,
    TokenDto tokenDto,
    String registerUUID,
    String provider,
    String email,
    String name
) {

    public static OAuth2LoginResult login(TokenDto tokenDto) {
        return new OAuth2LoginResult(true, tokenDto, null, null, null, null);
    }

    public static OAuth2LoginResult signupRequired(
        String registerUUID,
        String provider,
        String email,
        String name
    ) {
        return new OAuth2LoginResult(false, null, registerUUID, provider, email, name);
    }
}
