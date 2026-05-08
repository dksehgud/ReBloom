package com.ssafy.rebloom.event.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record InitiateConversationEvent(
    UUID userId,
    String serialNumber,
    LocalDateTime initiatedAt
) {
}