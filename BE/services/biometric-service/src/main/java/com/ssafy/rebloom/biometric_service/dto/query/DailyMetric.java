package com.ssafy.rebloom.biometric_service.dto.query;

import java.time.LocalDate;

public interface DailyMetric {
    LocalDate getDate();
    Double getValue();
}
