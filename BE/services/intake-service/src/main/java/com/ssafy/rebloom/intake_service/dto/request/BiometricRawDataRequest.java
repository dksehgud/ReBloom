package com.ssafy.rebloom.intake_service.dto.request;

import com.ssafy.rebloom.event.dto.BiometricDataEvent;
import java.time.LocalDateTime;
import java.util.UUID;

public record BiometricRawDataRequest(
    UUID userId,
    LocalDateTime tsStart,
    LocalDateTime tsEnd,
    Double hr,
    Double ibi,
    Double rmssd,
    Double pnn50,
    Double lfHf,
    Double accXAvg,
    Double accYAvg,
    Double accZAvg,
    Double accMag,
    Double hrAccRatio,
    Double missingnessScore
) {

    public BiometricDataEvent createEvent() {
        return new BiometricDataEvent(userId, tsStart, tsEnd, hr, ibi, rmssd, pnn50, lfHf, accXAvg,
            accYAvg, accZAvg, accMag, hrAccRatio, missingnessScore);
    }
}
