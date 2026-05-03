package com.ssafy.rebloom.auth_service.auth.dto.response;

public record EmailVerificationResponseDto (
    Boolean isVerified
){
    public static EmailVerificationResponseDto of(boolean isVerified) {
        return new EmailVerificationResponseDto(isVerified);
    }
}
