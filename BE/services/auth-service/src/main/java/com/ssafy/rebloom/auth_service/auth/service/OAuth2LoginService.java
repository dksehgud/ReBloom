package com.ssafy.rebloom.auth_service.auth.service;

import com.ssafy.rebloom.auth_service.auth.dto.OAuth2LoginResult;

public interface OAuth2LoginService {

    OAuth2LoginResult loginOrRegister(String provider, String providerUserId, String email, String name);
}
