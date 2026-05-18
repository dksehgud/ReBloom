package com.ssafy.rebloom.report_service.analysis.service;

import com.ssafy.rebloom.event.dto.DailyStatusCardCreatedEvent;
import com.ssafy.rebloom.report_service.analysis.client.AuthAccessClient;
import com.ssafy.rebloom.report_service.analysis.domain.entity.StatusCard;
import com.ssafy.rebloom.report_service.analysis.repository.StatusCardRepository;
import com.ssafy.rebloom.report_service.report.dto.response.StatusCardResponseDto;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StatusCardService {

    private final StatusCardRepository statusCardRepository;
    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final AuthAccessClient authAccessClient;

    public void save(DailyStatusCardCreatedEvent event) {
        statusCardRepository.findByUserIdAndDate(event.userId(), event.date())
            .ifPresentOrElse(
                statusCard -> statusCard.update(
                    event.title(),
                    event.description(),
                    event.subTitle(),
                    event.suggestion()
                ),
                () -> statusCardRepository.save(StatusCard.builder()
                    .userId(event.userId())
                    .date(event.date())
                    .title(event.title())
                    .description(event.description())
                    .subTitle(event.subTitle())
                    .suggestion(event.suggestion())
                    .build())
            );
    }

    @Transactional(readOnly = true)
    public Optional<StatusCardResponseDto> getRecentStatusCard(UUID parentId, UUID childrenId) {
        authAccessClient.validateParentChildAccess(parentId, childrenId);

        LocalDate today = LocalDate.now(SERVICE_ZONE);
        List<LocalDate> targetDates = List.of(today, today.minusDays(1));

        return statusCardRepository
            .findFirstByUserIdAndDateInOrderByDateDesc(childrenId, targetDates)
            .map(StatusCardResponseDto::from);
    }
}