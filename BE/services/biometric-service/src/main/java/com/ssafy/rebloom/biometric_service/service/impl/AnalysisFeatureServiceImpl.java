package com.ssafy.rebloom.biometric_service.service.impl;

import com.ssafy.rebloom.biometric_service.domain.entity.PhqResult;
import com.ssafy.rebloom.biometric_service.dto.response.AnalysisFeatureResponseDto;
import com.ssafy.rebloom.biometric_service.repository.PhqResultRepository;
import com.ssafy.rebloom.biometric_service.repository.SleepRepository;
import com.ssafy.rebloom.biometric_service.service.AnalysisFeatureService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalysisFeatureServiceImpl implements AnalysisFeatureService {

    private final SleepRepository sleepRepository;
    private final PhqResultRepository phqResultRepository;

    @Override
    public AnalysisFeatureResponseDto getAnalysisFeatures(
        UUID childrenId,
        LocalDate targetDate,
        LocalDateTime referenceDateTime
    ) {
        LocalDateTime to = referenceDateTime;
        LocalDateTime from = to.minusHours(24);

        Optional<Double> sleepScore = sleepRepository.findMaxSleepScoreByUserIdAndWakeupBetween(childrenId, from, to);
        Optional<PhqResult> phqResult = phqResultRepository.findTopByUserIdAndDateOrderByPredictedAtDesc(
            childrenId,
            targetDate
        );

        return new AnalysisFeatureResponseDto(
            sleepScore.map(this::toSleepFeature).orElse(null),
            phqResult.map(result -> result.getScore() / 100.0).orElse(null),
            sleepScore.isPresent(),
            phqResult.isPresent()
        );
    }

    private Double toSleepFeature(Double score) {
        if (score >= 75.0) {
            return 0.0;
        }
        if (score >= 60.0) {
            return 0.5;
        }
        return 1.0;
    }
}
