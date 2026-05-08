package com.ssafy.rebloom.event.support;

import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class EventTimeProvider {

    public LocalDateTime now() {
        return LocalDateTime.now();
    }
}