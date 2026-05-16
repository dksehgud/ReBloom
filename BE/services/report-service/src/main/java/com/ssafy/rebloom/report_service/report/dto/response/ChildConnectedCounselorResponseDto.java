package com.ssafy.rebloom.report_service.report.dto.response;

import java.util.UUID;

public record ChildConnectedCounselorResponseDto(
    boolean connected,
    UUID counselorId,
    String name,
    String email,
    String hospitalName
) {
}