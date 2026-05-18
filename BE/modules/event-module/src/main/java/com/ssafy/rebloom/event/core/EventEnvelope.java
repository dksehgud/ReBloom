package com.ssafy.rebloom.event.core;

import java.time.OffsetDateTime;

public record EventEnvelope<T>(
    String eventId,
    String eventType,
    String eventVersion,
    String producer,
    String correlationId,
    String idempotencyKey,
    OffsetDateTime occurredAt,
    T payload
) {
}