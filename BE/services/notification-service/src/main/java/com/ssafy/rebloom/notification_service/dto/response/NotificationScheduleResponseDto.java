package com.ssafy.rebloom.notification_service.dto.response;

import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import java.time.LocalTime;

public record NotificationScheduleResponseDto(
    ScheduleDay day,
    LocalTime time
) {
}
