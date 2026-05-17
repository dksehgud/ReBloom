package com.ssafy.rebloom.notification_service.dto;

import java.time.LocalTime;
import java.util.UUID;

public record DiaryReminderDueSchedule(
    Long scheduleId,
    UUID userId,
    LocalTime time
) {
}