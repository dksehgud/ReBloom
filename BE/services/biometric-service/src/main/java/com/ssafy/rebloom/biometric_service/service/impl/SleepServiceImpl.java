package com.ssafy.rebloom.biometric_service.service.impl;

import com.ssafy.rebloom.biometric_service.domain.entity.Sleep;
import com.ssafy.rebloom.biometric_service.domain.entity.SleepId;
import com.ssafy.rebloom.biometric_service.repository.SleepRepository;
import com.ssafy.rebloom.biometric_service.service.SleepService;
import com.ssafy.rebloom.event.dto.SleepDataEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SleepServiceImpl implements SleepService {

    private final SleepRepository sleepRepository;
    @Override
    @Transactional
    public void saveSleepRawEvent(SleepDataEvent sleepDataEvent, String correlationId) {
        SleepId sleepId = SleepId.create(sleepDataEvent.userId(), sleepDataEvent.wakeup());

        Sleep sleep = Sleep.create(sleepId, sleepDataEvent.asleep(), sleepDataEvent.sleepDuration(),
            sleepDataEvent.waso(), sleepDataEvent.sleepScore(),
            sleepDataEvent.sleepEfficiency());

        sleepRepository.save(sleep);
    }
}
