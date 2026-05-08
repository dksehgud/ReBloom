package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ParentConnectedChildResponseDto(
    boolean connected,
    UUID childrenId,
    String name,
    String email,
    Integer age
) {
    public static ParentConnectedChildResponseDto disconnected() {
        return new ParentConnectedChildResponseDto(false, null, null, null, null);
    }
}
