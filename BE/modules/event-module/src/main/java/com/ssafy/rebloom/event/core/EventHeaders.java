package com.ssafy.rebloom.event.core;

public final class EventHeaders {

    public static final String EVENT_ID = "x-event-id";
    public static final String EVENT_TYPE = "x-event-type";
    public static final String EVENT_VERSION = "x-event-version";
    public static final String PRODUCER = "x-producer";
    public static final String CORRELATION_ID = "x-correlation-id";
    public static final String IDEMPOTENCY_KEY = "x-idempotency-key";
    public static final String RETRY_COUNT = "x-retry-count";

    private EventHeaders() {
    }
}