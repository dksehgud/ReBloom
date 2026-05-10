package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.event.dto.SleepDataEvent;

public interface SleepEventService {

    void saveSleepRawEvent(SleepDataEvent sleepDataEvent, String correlationId);
}
