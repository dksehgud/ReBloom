package com.ssafy.rebloom.biometric_service.repository.query;

import com.ssafy.rebloom.biometric_service.dto.query.SleepEfficiencyDto;
import com.ssafy.rebloom.biometric_service.dto.query.SleepScoreDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SleepQueryRepository {

    List<SleepScoreDto> findSleepScoresByRange(UUID childrenId, LocalDateTime from, LocalDateTime to);

    List<SleepEfficiencyDto> findSleepEfficienciesByRange(UUID childrenId, LocalDateTime from, LocalDateTime to);
}
