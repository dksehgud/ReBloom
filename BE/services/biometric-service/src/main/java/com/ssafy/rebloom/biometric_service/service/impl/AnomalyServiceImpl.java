package com.ssafy.rebloom.biometric_service.service.impl;

import com.ssafy.rebloom.biometric_service.domain.entity.Anomaly;
import com.ssafy.rebloom.biometric_service.repository.AnomalyRepository;
import com.ssafy.rebloom.biometric_service.service.AnomalyService;
import com.ssafy.rebloom.event.dto.AnomalyEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyServiceImpl implements AnomalyService {

    private final AnomalyRepository anomalyRepository;
    @Override
    public void save(AnomalyEvent event, String correlationId) {
        Anomaly anomaly = Anomaly.create(
            event.userId(),
            event.tsStart(),
            event.tsEnd(),
            event.hr(),
            event.rmssd(),
            event.pnn50(),
            event.lfHf(),
            event.accMag(),
            event.hrAccRatio(),
            event.isAnomaly()
        );

        anomalyRepository.save(anomaly);
    }
}
