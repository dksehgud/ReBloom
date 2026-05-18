package com.ssafy.rebloom.report_service.report.dto.response;

import com.ssafy.rebloom.report_service.analysis.domain.entity.StatusCard;
import java.time.LocalDate;
import java.util.UUID;

public record StatusCardResponseDto(
    UUID userId,
    LocalDate date,
    String title,
    String description,
    String subTitle,
    String suggestion
) {

    public static StatusCardResponseDto from(StatusCard statusCard) {
        return new StatusCardResponseDto(
            statusCard.getUserId(),
            statusCard.getDate(),
            statusCard.getTitle(),
            statusCard.getDescription(),
            statusCard.getSubTitle(),
            statusCard.getSuggestion()
        );
    }
}