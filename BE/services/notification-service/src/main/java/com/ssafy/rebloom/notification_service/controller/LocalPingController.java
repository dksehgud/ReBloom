package com.ssafy.rebloom.notification_service.controller;

import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("local")
public class LocalPingController {

    @GetMapping("/internal/ping")
    public Map<String, String> ping() {
        return Map.of(
                "service", "notification-service",
                "status", "ok"
        );
    }
}
