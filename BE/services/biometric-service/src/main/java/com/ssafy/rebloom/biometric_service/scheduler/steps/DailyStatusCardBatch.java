package com.ssafy.rebloom.biometric_service.scheduler.steps;

import com.ssafy.rebloom.biometric_service.client.AuthAccessClient;
import com.ssafy.rebloom.biometric_service.dto.response.ActiveChildResponseDto;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyStatusCardBatch {

    private final AuthAccessClient authAccessClient;
    private final DailyStatusCardUserStep dailyStatusCardUserStep;

    public void run() {
        LocalDate baseDate = LocalDate.now();
        List<ActiveChildResponseDto> activeChildren = authAccessClient.getActiveChildren();

        log.info("Daily status card batch started. activeChildCount={}", activeChildren.size());

        for (ActiveChildResponseDto child : activeChildren) {
            try {
                dailyStatusCardUserStep.process(child, baseDate);
            } catch (RuntimeException e) {
                log.error("Daily status card user step failed. userId={}", child.userId(), e);
            }
        }

        log.info("Daily status card batch finished. activeChildCount={}", activeChildren.size());
    }
}