package com.ssafy.rebloom.biometric_service.scheduler.steps;

import com.ssafy.rebloom.biometric_service.client.AuthAccessClient;
import com.ssafy.rebloom.biometric_service.domain.entity.Biometric;
import com.ssafy.rebloom.biometric_service.domain.entity.Sleep;
import com.ssafy.rebloom.biometric_service.repository.BiometricRepository;
import com.ssafy.rebloom.biometric_service.repository.SleepRepository;
import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.AiModelRetrainRequestedEvent;
import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import com.ssafy.rebloom.event.dto.SleepDataEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyRetrainingUserStep {

    private static final int PHQ_READY_DAYS = 14;
    private static final String REASON_DAILY_RETRAINING = "DAILY_RETRAINING";

    private final SleepRepository sleepRepository;
    private final BiometricRepository biometricRepository;
    private final AuthAccessClient authAccessClient;
    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;
    private final EventPublisher eventPublisher;

    @Transactional
    public void process(UUID userId) {
        RetrainingPayload payload = collectPayload(userId);
        if (payload == null) {
            return;
        }

        Integer age = payload.phqReady() ? authAccessClient.getChildAge(userId) : null;
        publish(userId, age, payload.biometrics(), payload.sleeps());
    }

    protected RetrainingPayload collectPayload(UUID userId) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        sleepRepository.clearMainSleepByDate(userId, yesterday);
        sleepRepository.markLongestSleepAsMainByDate(userId, yesterday);

        boolean phqReady = isPhqReady(userId);
        List<BiometricDataEvent> biometrics = findBiometrics(userId, phqReady);
        List<SleepDataEvent> sleeps = phqReady ? findRecentMainSleeps(userId) : List.of();

        return new RetrainingPayload(phqReady, biometrics, sleeps);
    }

    private boolean isPhqReady(UUID userId) {
        return sleepRepository.findFirstWakeup(userId)
            .map(firstWakeup -> ChronoUnit.DAYS.between(firstWakeup.toLocalDate(), LocalDate.now()) >= PHQ_READY_DAYS)
            .orElse(false);
    }

    private List<BiometricDataEvent> findBiometrics(UUID userId, boolean phqReady) {
        if (!phqReady) {
            return biometricRepository.findAllByUserIdOrderByTsStart(userId)
                .stream()
                .map(Biometric::toEvent)
                .toList();
        }

        LocalDateTime from = LocalDate.now().minusDays(PHQ_READY_DAYS).atStartOfDay();
        return biometricRepository.findBiometricsInRange(userId, from, LocalDateTime.now())
            .stream()
            .map(Biometric::toEvent)
            .toList();
    }

    private List<SleepDataEvent> findRecentMainSleeps(UUID userId) {
        LocalDateTime from = LocalDate.now().minusDays(PHQ_READY_DAYS).atStartOfDay();
        return sleepRepository.findMainSleepsFrom(userId, from)
            .stream()
            .map(Sleep::toEvent)
            .toList();
    }

    private void publish(
        UUID userId,
        Integer age,
        List<BiometricDataEvent> biometrics,
        List<SleepDataEvent> sleeps
    ) {
        AiModelRetrainRequestedEvent event = new AiModelRetrainRequestedEvent(
            userId,
            age,
            biometrics,
            sleeps
        );

        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.MODEL_RETRAINING_REQUESTED,
            userId.toString(),
            REASON_DAILY_RETRAINING + ":" + LocalDate.now()
        );

        eventPublisher.publish(
            kafkaProperties.getTopics().getModelRetrainingRequested(),
            eventKeyGenerator.userKey(userId),
            EventTypes.MODEL_RETRAINING_REQUESTED,
            null,
            idempotencyKey,
            event
        );
    }

    private record RetrainingPayload(
        boolean phqReady,
        List<BiometricDataEvent> biometrics,
        List<SleepDataEvent> sleeps
    ) {
    }
}
