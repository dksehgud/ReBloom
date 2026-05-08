package com.ssafy.rebloom.event.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record BiometricDataEvent(
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

}
