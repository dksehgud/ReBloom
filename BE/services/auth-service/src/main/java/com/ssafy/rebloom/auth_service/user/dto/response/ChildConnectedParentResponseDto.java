package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChildConnectedParentResponseDto(
    boolean connected,
    UUID parentId,
    String name,
    String email
) {
    public static ChildConnectedParentResponseDto disconnected() {
        return new ChildConnectedParentResponseDto(false, null, null, null);
    }
}
