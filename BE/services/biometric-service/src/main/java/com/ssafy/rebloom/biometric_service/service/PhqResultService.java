package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.event.dto.PhqResultEvent;

public interface PhqResultService {

    void save(PhqResultEvent event, String correlationId);
}
