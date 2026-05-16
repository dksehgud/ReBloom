package com.ssafy.rebloom.notification_service.dto.response;

import java.util.UUID;

public record CounselorReceiverResponseDto(
    boolean connected,
    UUID counselorId,
    String name,
    String email,
    String hospitalName
) {
}