package com.ssafy.rebloom.event.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PhqResultEvent(
    UUID userId,
    LocalDate date,
    Integer result,
    Double score,
    LocalDateTime predictedAt
) {
}