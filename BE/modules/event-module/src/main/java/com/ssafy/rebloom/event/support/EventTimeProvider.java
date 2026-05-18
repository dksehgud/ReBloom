package com.ssafy.rebloom.event.support;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import org.springframework.stereotype.Component;

@Component
public class EventTimeProvider {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    public OffsetDateTime now() {
        return OffsetDateTime.now(SEOUL_ZONE);
    }
}