package com.ssafy.rebloom.biometric_service.scheduler.steps;

import com.ssafy.rebloom.biometric_service.domain.entity.Biometric;
import com.ssafy.rebloom.biometric_service.domain.entity.Sleep;
import com.ssafy.rebloom.biometric_service.dto.response.ActiveChildResponseDto;
import com.ssafy.rebloom.biometric_service.repository.BiometricRepository;
import com.ssafy.rebloom.biometric_service.repository.SleepRepository;
import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import com.ssafy.rebloom.event.dto.DailyStatusCardRequestedEvent;
import com.ssafy.rebloom.event.dto.SleepDataEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyStatusCardUserStep {

    private static final int STATUS_CARD_LOOKBACK_DAYS = 10;
    private static final String REASON_DAILY_STATUS_CARD = "DAILY_STATUS_CARD";

    private final BiometricRepository biometricRepository;
    private final SleepRepository sleepRepository;
    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;
    private final EventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public void process(ActiveChildResponseDto child, LocalDate baseDate) {
        LocalDateTime from = baseDate.minusDays(STATUS_CARD_LOOKBACK_DAYS - 1L).atStartOfDay();
        LocalDateTime to = baseDate.plusDays(1).atStartOfDay();

        List<BiometricDataEvent> biometrics = biometricRepository
            .findBiometricsInRange(child.userId(), from, to)
            .stream()
            .map(Biometric::toEvent)
            .toList();

        List<SleepDataEvent> sleeps = sleepRepository
            .findMainSleepsInRange(child.userId(), from, to)
            .stream()
            .map(Sleep::toEvent)
            .toList();

        if (shouldSkip(child, baseDate, biometrics, sleeps)) {
            return;
        }

        publish(child, baseDate, biometrics, sleeps);
    }

    private boolean shouldSkip(
        ActiveChildResponseDto child,
        LocalDate baseDate,
        List<BiometricDataEvent> biometrics,
        List<SleepDataEvent> sleeps
    ) {
        if (biometrics.isEmpty() || sleeps.isEmpty()) {
            log.info(
                "Skip daily status card. data is empty. userId={}, biometricCount={}, sleepCount={}",
                child.userId(),
                biometrics.size(),
                sleeps.size()
            );
            return true;
        }

        Set<LocalDate> acceptableLatestDates = Set.of(baseDate, baseDate.minusDays(1));

        LocalDate latestBiometricDate = biometrics.stream()
            .map(BiometricDataEvent::tsStart)
            .max(Comparator.naturalOrder())
            .map(LocalDateTime::toLocalDate)
            .orElse(null);

        LocalDate latestSleepDate = sleeps.stream()
            .map(SleepDataEvent::date)
            .max(Comparator.naturalOrder())
            .orElse(null);

        boolean latestBiometricFresh = acceptableLatestDates.contains(latestBiometricDate);
        boolean latestSleepFresh = acceptableLatestDates.contains(latestSleepDate);

        if (!latestBiometricFresh || !latestSleepFresh) {
            log.info(
                "Skip daily status card. latest data is stale. userId={}, latestBiometricDate={}, latestSleepDate={}",
                child.userId(),
                latestBiometricDate,
                latestSleepDate
            );
            return true;
        }

        return false;
    }

    private void publish(
        ActiveChildResponseDto child,
        LocalDate baseDate,
        List<BiometricDataEvent> biometrics,
        List<SleepDataEvent> sleeps
    ) {
        DailyStatusCardRequestedEvent event = new DailyStatusCardRequestedEvent(
            child.userId(),
            child.name(),
            biometrics,
            sleeps
        );

        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.STATUS_CARD_REQUESTED,
            child.userId().toString(),
            REASON_DAILY_STATUS_CARD + ":" + baseDate
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getStatusCardRequested(),
            eventKeyGenerator.userKey(child.userId()),
            EventTypes.STATUS_CARD_REQUESTED,
            null,
            idempotencyKey,
            event
        );

        log.info(
            "Published daily status card request. userId={}, biometricCount={}, sleepCount={}",
            child.userId(),
            biometrics.size(),
            sleeps.size()
        );
    }
}