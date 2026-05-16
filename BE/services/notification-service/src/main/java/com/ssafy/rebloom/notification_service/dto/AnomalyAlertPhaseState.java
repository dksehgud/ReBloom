package com.ssafy.rebloom.notification_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AnomalyAlertPhaseState(
    UUID childrenId,
    UUID parentId,
    String childrenName,
    String correlationId,
    int sentCount,
    LocalDateTime startedAt,
    LocalDateTime nextActionAt
) {

    public AnomalyAlertPhaseState increaseSentCount(LocalDateTime nextActionAt) {
        return new AnomalyAlertPhaseState(
            childrenId,
            parentId,
            childrenName,
            correlationId,
            sentCount + 1,
            startedAt,
            nextActionAt
        );
    }
}