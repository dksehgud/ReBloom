package com.ssafy.rebloom.auth_service.user.controller;

import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> signup(
        @RequestBody @Valid UserCreateRequestDto userCreateRequestDto
    ) {
        userService.signupUser(userCreateRequestDto);
        return ResponseEntity.ok(BaseResponse.success("회원가입 성공"));
    }

}
