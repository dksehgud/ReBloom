package com.ssafy.rebloom.event.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DailyStatusCardCreatedEvent(
    UUID userId,
    LocalDate date,
    String title,
    String description,
    String subTitle,
    String suggestion
) {
}