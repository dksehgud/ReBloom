package com.ssafy.rebloom.notification_service.dto;

import java.util.UUID;

public record CounselorReceiverInfo(
    UUID counselorId,
    String counselorName
) {
}