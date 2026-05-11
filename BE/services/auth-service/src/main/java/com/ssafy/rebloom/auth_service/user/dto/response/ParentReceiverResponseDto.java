package com.ssafy.rebloom.auth_service.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ParentReceiverResponseDto(
    boolean connected,
    UUID parentId,
    UUID childrenId,
    String childrenName
) {

    public static ParentReceiverResponseDto disconnected(UUID childrenId) {
        return new ParentReceiverResponseDto(false, null, childrenId, null);
    }
}