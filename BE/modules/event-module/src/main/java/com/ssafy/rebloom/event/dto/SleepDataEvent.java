package com.ssafy.rebloom.event.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record SleepDataEvent(
    UUID userId,
    LocalDateTime wakeup,
    LocalDateTime asleep,
    LocalDate date,
    Double sleepDuration,
    Double waso,
    Double sleepScore,
    Double sleepEfficiency
) {
}