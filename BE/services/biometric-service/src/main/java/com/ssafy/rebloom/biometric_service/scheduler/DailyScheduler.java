package com.ssafy.rebloom.biometric_service.scheduler;

import com.ssafy.rebloom.biometric_service.scheduler.steps.DailyRetrainingBatch;
import com.ssafy.rebloom.biometric_service.service.RedisService;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyScheduler {

    private static final String LOCK_KEY = "scheduler:daily-retraining:lock";
    private static final Duration LOCK_TTL = Duration.ofHours(2);

    private final RedisService redisService;
    private final DailyRetrainingBatch dailyRetrainingBatch;

    @Scheduled(
        cron = "${rebloom.scheduler.daily-retraining.cron:0 0 0 * * *}",
        zone = "${rebloom.scheduler.daily-retraining.zone:Asia/Seoul}"
    )
    public void runDailyRetraining() {
        if (!redisService.setIfAbsent(LOCK_KEY, "locked", LOCK_TTL)) {
            log.info("Daily retraining scheduler is already running on another instance.");
            return;
        }

        try {
            dailyRetrainingBatch.run();
        } finally {
            redisService.delete(LOCK_KEY);
        }
    }
}
