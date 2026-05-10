package com.ssafy.rebloom.biometric_service.service.impl;

import com.ssafy.rebloom.biometric_service.domain.entity.PhqResult;
import com.ssafy.rebloom.biometric_service.repository.PhqResultRepository;
import com.ssafy.rebloom.biometric_service.service.PhqResultService;
import com.ssafy.rebloom.event.dto.PhqResultEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PhqResultServiceImpl implements PhqResultService {

    private final PhqResultRepository phqResultRepository;
    @Override
    public void save(PhqResultEvent event, String correlationId) {
        PhqResult phqResult = PhqResult.create(event.userId(), event.date(), event.result(),
            event.score(), event.predictedAt());

        phqResultRepository.save(phqResult);
    }
}
