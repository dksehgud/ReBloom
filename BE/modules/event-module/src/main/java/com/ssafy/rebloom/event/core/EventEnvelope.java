package com.ssafy.rebloom.event.core;

import java.time.LocalDateTime;

public record EventEnvelope<T>(
    String eventId,
    String eventType,
    String eventVersion,
    String producer,
    String correlationId,
    String idempotencyKey,
    LocalDateTime occurredAt,
    T payload
) {
}