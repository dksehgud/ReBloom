package com.ssafy.rebloom.intake_service.dto.request;

import com.ssafy.rebloom.event.dto.SleepDataEvent;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record SleepRawDataRequest (
    UUID userId,
    LocalDateTime wakeup,
    LocalDateTime asleep,
    LocalDate date,
    Double sleepDuration,
    Double waso,
    Double sleepScore,
    Double sleepEfficiency
) {
    public SleepDataEvent createEvent() {
        return new SleepDataEvent(
            userId,
            wakeup,
            asleep,
            date,
            sleepDuration,
            waso,
            sleepScore,
            sleepEfficiency
        );
    }
}
