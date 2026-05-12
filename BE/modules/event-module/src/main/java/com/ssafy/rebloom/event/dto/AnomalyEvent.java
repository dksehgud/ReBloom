package com.ssafy.rebloom.event.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record AnomalyEvent (
    Long id,
    UUID userId,
    LocalDateTime tsStart,
    LocalDateTime tsEnd,
    Double hr,
    Double rmssd,
    Double pnn50,
    Double lfHf,
    Double accMag,
    Double hrAccRatio,
    Boolean isAnomaly // NULL(미실행), true(확정), false(오탐)
){

}
