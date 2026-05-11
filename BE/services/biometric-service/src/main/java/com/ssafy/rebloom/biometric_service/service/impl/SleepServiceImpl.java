package com.ssafy.rebloom.biometric_service.service.impl;

import com.ssafy.rebloom.biometric_service.client.AuthAccessClient;
import com.ssafy.rebloom.biometric_service.constants.Constants;
import com.ssafy.rebloom.biometric_service.domain.entity.Sleep;
import com.ssafy.rebloom.biometric_service.domain.entity.SleepId;
import com.ssafy.rebloom.biometric_service.dto.query.SleepEfficiencyDto;
import com.ssafy.rebloom.biometric_service.dto.query.SleepScoreDto;
import com.ssafy.rebloom.biometric_service.dto.response.SleepChartResponseDto;
import com.ssafy.rebloom.biometric_service.repository.SleepRepository;
import com.ssafy.rebloom.biometric_service.service.SleepService;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.event.dto.SleepDataEvent;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SleepServiceImpl implements SleepService {

    private final SleepRepository sleepRepository;
    private final AuthAccessClient authAccessClient;

    @Override
    @Transactional
    public void saveSleepRawEvent(SleepDataEvent sleepDataEvent, String correlationId) {
        SleepId sleepId = SleepId.create(sleepDataEvent.userId(), sleepDataEvent.wakeup());

        Sleep sleep = Sleep.create(sleepId, sleepDataEvent.asleep(), sleepDataEvent.sleepDuration(),
            sleepDataEvent.waso(), sleepDataEvent.sleepScore(),
            sleepDataEvent.sleepEfficiency());

        sleepRepository.save(sleep);
    }

    @Override
    public ListResponseDto<SleepChartResponseDto> getSleepScores(UUID userId, String role,
        UUID childrenId, LocalDate baseDate) {
        //권한 검증
        validateRelation(userId, role, childrenId);

        LocalDate startDate = baseDate.minusDays(Constants.SLEEP_CHART_DAYS - 1);
        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = baseDate.plusDays(1).atStartOfDay(); // 다음날 00:00 전까지

        // 리포지토리에서 수면 조회 -> Map 변환
        Map<LocalDate, Double> scoreMap = sleepRepository
            .findSleepScoresByRange(childrenId, from, to)
            .stream()
            .collect(Collectors.toMap(
                SleepScoreDto::date,
                SleepScoreDto::score,
                (existing, replacement) -> existing
            ));

        // 차트 기간 순회하며 빈 날짜 -> null
        List<SleepChartResponseDto> responses = IntStream.range(0, Constants.SLEEP_CHART_DAYS)
            .mapToObj(startDate::plusDays)
            .map(date -> {
                return SleepChartResponseDto.from(date, scoreMap.get(date));
            })
            .toList();

        return ListResponseDto.from(responses);
    }

    @Override
    public ListResponseDto<SleepChartResponseDto> getSleepEfficiencies(
        UUID userId,
        String role,
        UUID childrenId,
        LocalDate baseDate
    ) {
        // 권한 검증
        validateRelation(userId, role, childrenId);

        LocalDate startDate = baseDate.minusDays(Constants.SLEEP_CHART_DAYS - 1);
        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = baseDate.plusDays(1).atStartOfDay();

        Map<LocalDate, Double> efficiencyMap = sleepRepository
            .findSleepEfficienciesByRange(childrenId, from, to)
            .stream()
            .collect(Collectors.toMap(
                SleepEfficiencyDto::date,
                SleepEfficiencyDto::efficiency,
                (existing, replacement) -> existing
            ));

        List<SleepChartResponseDto> responses = IntStream.range(0, Constants.SLEEP_CHART_DAYS)
            .mapToObj(startDate::plusDays)
            .map(date -> SleepChartResponseDto.from(date, efficiencyMap.get(date)))
            .toList();

        return ListResponseDto.from(responses);
    }

    private void validateRelation(UUID userId, String role, UUID childrenId) {
        if ("PARENT".equals(role)) {
            authAccessClient.validateParentChildAccess(userId, childrenId);
            return;
        }

        if ("COUNSELOR".equals(role)) {
            authAccessClient.validateCounselorChildAccess(userId, childrenId);
            return;
        }

        throw new CustomException("아이 수면 기록을 조회할 권한이 없습니다.", ErrorCode.FORBIDDEN);
    }

}
