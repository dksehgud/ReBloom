package com.ssafy.rebloom.notification_service.scheduler;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.service.AnomalyAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnomalyAlertPhaseScheduler {

    private final AnomalyAlertService anomalyAlertService;

    @Scheduled(fixedDelay = Constants.ANOMALY_ALERT_PHASE_SCAN_INTERVAL_MS)
    public void processDueAnomalyAlertPhases() {
        try {
            anomalyAlertService.processDuePhases();
        } catch (RuntimeException e) {
            log.error("Failed to process anomaly alert phases.", e);
        }
    }
}