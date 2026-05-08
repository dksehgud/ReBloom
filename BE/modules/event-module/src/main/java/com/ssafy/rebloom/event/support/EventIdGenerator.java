package com.ssafy.rebloom.event.support;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class EventIdGenerator {

    public String generate() {
        return UUID.randomUUID().toString();
    }
}