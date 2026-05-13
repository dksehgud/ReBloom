package com.ssafy.rebloom.biometric_service.scheduler.steps;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyRetrainingBatch {

    private final UserBatchTargetReader userBatchTargetReader;
    private final DailyRetrainingUserStep dailyRetrainingUserStep;

    public void run() {
        List<UUID> userIds = userBatchTargetReader.findTargetUserIds();
        log.info("Daily retraining batch started. targetUserCount={}", userIds.size());

        for (UUID userId : userIds) {
            try {
                dailyRetrainingUserStep.process(userId);
            } catch (RuntimeException e) {
                log.error("Daily retraining user step failed. userId={}", userId, e);
            }
        }

        log.info("Daily retraining batch finished. targetUserCount={}", userIds.size());
    }
}
