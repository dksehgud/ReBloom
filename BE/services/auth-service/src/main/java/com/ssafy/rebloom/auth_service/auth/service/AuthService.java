package com.ssafy.rebloom.auth_service.auth.service;

import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.dto.request.LoginRequestDto;

public interface AuthService {

    TokenDto login(LoginRequestDto loginRequestDto);

    void logout(String refreshToken);

    TokenDto reissue(String refreshToken);

    long getRefreshTokenMaxAgeSeconds();

}
