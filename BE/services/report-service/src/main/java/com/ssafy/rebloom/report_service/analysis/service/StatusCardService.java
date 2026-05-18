package com.ssafy.rebloom.report_service.analysis.service;

import com.ssafy.rebloom.event.dto.DailyStatusCardCreatedEvent;
import com.ssafy.rebloom.report_service.analysis.domain.entity.StatusCard;
import com.ssafy.rebloom.report_service.analysis.repository.StatusCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StatusCardService {

    private final StatusCardRepository statusCardRepository;

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
}