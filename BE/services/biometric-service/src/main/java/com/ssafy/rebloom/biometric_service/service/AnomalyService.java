package com.ssafy.rebloom.biometric_service.service;

import com.ssafy.rebloom.event.dto.AnomalyEvent;

public interface AnomalyService {
    void save(AnomalyEvent event, String correlationId);
}
