package com.ssafy.rebloom.auth_service.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.Builder;

@Builder
@JsonInclude(Include.NON_NULL)
public record LoginResponseDto(
    String accessToken,
    String refreshToken
) {

    public static LoginResponseDto of(
        String accessToken,
        String refreshToken
    ) {
        return LoginResponseDto.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
    }

}