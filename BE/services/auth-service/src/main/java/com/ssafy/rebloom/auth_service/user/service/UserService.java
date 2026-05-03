package com.ssafy.rebloom.auth_service.user.service;

import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;

public interface UserService {

    boolean isAlreadyExistsEmail(String email);

    void signupUser(UserCreateRequestDto userCreateRequestDto);


}
