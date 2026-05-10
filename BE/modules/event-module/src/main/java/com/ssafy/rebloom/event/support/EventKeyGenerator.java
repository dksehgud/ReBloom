package com.ssafy.rebloom.event.support;

import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

@Component
public class EventKeyGenerator {

    public String userKey(UUID userId) {
        Assert.notNull(userId, "userId must not be null");
        return String.valueOf(userId);
    }

    public String idempotencyKey(String eventType, String userId, String sourceId) {
        Assert.hasText(eventType, "eventType must not be blank");
        Assert.notNull(userId, "userId must not be null");
        Assert.hasText(sourceId, "sourceId must not be blank");
        return eventType + ":" + userId + ":" + sourceId;
    }
}