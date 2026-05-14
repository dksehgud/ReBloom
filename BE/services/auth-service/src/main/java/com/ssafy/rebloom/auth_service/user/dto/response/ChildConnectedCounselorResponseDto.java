package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChildConnectedCounselorResponseDto(
    boolean connected,
    UUID counselorId,
    String name,
    String email,
    String hospitalName
) {
    public static ChildConnectedCounselorResponseDto disconnected() {
        return new ChildConnectedCounselorResponseDto(false, null, null, null, null);
    }
}
