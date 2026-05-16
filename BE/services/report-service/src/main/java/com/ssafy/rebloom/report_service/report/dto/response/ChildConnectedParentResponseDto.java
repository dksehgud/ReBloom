package com.ssafy.rebloom.report_service.report.dto.response;

import java.util.UUID;

public record ChildConnectedParentResponseDto(
    boolean connected,
    UUID parentId,
    String name,
    String email
) {
}