package com.ssafy.rebloom.event.exception;

import lombok.Getter;

@Getter
public class EventPublishException extends RuntimeException {

    private final String topic;
    private final String key;
    private final String eventType;

    public EventPublishException(String topic, String key, String eventType, Throwable cause) {
        super("Failed to publish event. topic=%s, key=%s, eventType=%s".formatted(topic, key, eventType), cause);
        this.topic = topic;
        this.key = key;
        this.eventType = eventType;
    }
}
