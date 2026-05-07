package com.ssafy.rebloom.event.core;

import java.time.Instant;

public record EventEnvelope<T>(
    String eventId,
    String eventType,
    String eventVersion,
    String producer,
    String correlationId,
    String idempotencyKey,
    Instant occurredAt,
    T payload
) {
}