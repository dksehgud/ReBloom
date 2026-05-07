package com.ssafy.rebloom.event.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record SleepDataEvent(
    UUID userId,
    LocalDate date,
    LocalDateTime asleep,
    LocalDateTime wakeup,
    Double sleepDuration,
    Double waso,
    Double sleepScore,
    Double sleepEfficiency
) {
}