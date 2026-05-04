package com.ssafy.rebloom.auth_service.auth.dto.response;

public record EmailDuplicateResponseDto (
    Boolean isDuplicate
){
    public static EmailDuplicateResponseDto from(Boolean isDuplicate) {
        return new EmailDuplicateResponseDto(isDuplicate);
    }
}
