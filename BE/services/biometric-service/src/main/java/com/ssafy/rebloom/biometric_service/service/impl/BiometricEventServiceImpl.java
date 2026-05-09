package com.ssafy.rebloom.biometric_service.service.impl;

import com.ssafy.rebloom.biometric_service.constants.Constants;
import com.ssafy.rebloom.biometric_service.domain.entity.Biometric;
import com.ssafy.rebloom.biometric_service.domain.entity.BiometricId;
import com.ssafy.rebloom.biometric_service.repository.BiometricRepository;
import com.ssafy.rebloom.biometric_service.service.BiometricEventService;
import com.ssafy.rebloom.biometric_service.service.RedisService;
import com.ssafy.rebloom.event.config.property.KafkaCommonProperties;
import com.ssafy.rebloom.event.core.EventTypes;
import com.ssafy.rebloom.event.dto.AiModelTrainRequestEvent;
import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import com.ssafy.rebloom.event.publisher.EventPublisher;
import com.ssafy.rebloom.event.support.EventKeyGenerator;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BiometricEventServiceImpl implements BiometricEventService {

    private final BiometricRepository biometricRepository;
    private final RedisService redisService;

    private final KafkaCommonProperties kafkaProperties;
    private final EventKeyGenerator eventKeyGenerator;
    private final EventPublisher eventPublisher;

    @Override
    public void save(BiometricDataEvent event, String correlationId) {
        BiometricId biometricId = BiometricId.create(event.userId(), event.tsStart());
        Biometric biometric = Biometric.create(biometricId, event.tsEnd(), event.hr(), event.ibi(),
            event.rmssd(), event.pnn50(), event.lfHf(), event.accXAvg(), event.accYAvg(),
            event.accZAvg(), event.accMag(), event.hrAccRatio(), event.missingnessScore());
        biometricRepository.save(biometric);
        
        // Isolation Forest Model Training 트리거
        handleInitialTrainingTrigger(event, correlationId, 1L);
    }
    
    @Override
    public void requestAITraining(
        UUID userId,
        LocalDateTime currentMeasuredAt,
        String correlationId
    ) {
        LocalDateTime to = currentMeasuredAt;
        LocalDateTime from = to.minusDays(14);

        // 모델 훈련용 생체 데이터 조회
        List<BiometricDataEvent> records = biometricRepository
            .findBiometricsInRange(userId, from, to)
            .stream()
            .map(Biometric::toEvent)
            .toList();
        
        // 이벤트 생성
        AiModelTrainRequestEvent event = new AiModelTrainRequestEvent(
            userId,
            Constants.MODEL_TYPE_ISOLATION_FOREST,
            Constants.REASON_BIOMETRIC_COUNT_REACHED,
            Constants.TRAINING_COUNT,
            LocalDateTime.now(),
            records
        );
        
        // 이벤트 키 생성
        String key = userId.toString();
        String idempotencyKey = eventKeyGenerator.idempotencyKey(
            EventTypes.AI_MODEL_TRAIN_REQUESTED,
            userId.toString(),
            Constants.MODEL_TYPE_ISOLATION_FOREST
        );
        
        // 이벤트 발행
        eventPublisher.publish(
            kafkaProperties.getTopics().getAiModelTrainRequest(),
            key,
            EventTypes.AI_MODEL_TRAIN_REQUESTED,
            correlationId,
            idempotencyKey,
            event
        );
    }

    private void handleInitialTrainingTrigger(
        BiometricDataEvent event,
        String correlationId,
        long savedRecordCount
    ) {
        UUID userId = event.userId();
        // 훈련 완료 여부 조회
        if (isTrainingAlreadyRequested(userId)) {
            return;
        }
        // 카운트 횟수
        long count = redisService.incrementBy(countKey(userId), savedRecordCount);

        if (count < Constants.TRAINING_COUNT) {
            return;
        }
        // 카운트 횟수 이상일 시 훈련 완료 등록
        boolean marked = redisService.setIfAbsent(trainRequestedKey(userId), "true");
        if (!marked) {
            return;
        }

        // 모델 훈련 이벤트 발행 및 카운트 키는 제거
        try {
            requestAITraining(userId, event.tsStart(), correlationId);
            redisService.delete(countKey(userId));
        } catch (RuntimeException e) {
            redisService.delete(trainRequestedKey(userId));
            throw e;
        }
    }
    
    private boolean isTrainingAlreadyRequested(UUID userId) {
        return redisService.exists(trainRequestedKey(userId));
    }

    private String countKey(UUID userId) {
        return Constants.COUNT_KEY_PREFIX + userId;
    }

    private String trainRequestedKey(UUID userId) {
        return Constants.TRAIN_REQUESTED_KEY_PREFIX + userId;
    }

}
