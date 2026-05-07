package com.ssafy.rebloom.event.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record BiometricDataEvent (
    Long userId,
    Map<String, Object> biometrics,
    LocalDateTime timestamp
){

}
