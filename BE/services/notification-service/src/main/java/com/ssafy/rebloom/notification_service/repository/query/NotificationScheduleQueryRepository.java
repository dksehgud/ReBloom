package com.ssafy.rebloom.notification_service.repository.query;

import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import com.ssafy.rebloom.notification_service.dto.DiaryReminderDueSchedule;
import com.ssafy.rebloom.notification_service.dto.response.NotificationScheduleResponseDto;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface NotificationScheduleQueryRepository {

    List<NotificationScheduleResponseDto> findDiaryReminderSchedules(UUID userId);

    long deleteDiaryReminderSchedules(UUID userId, Long notificationTypeId);

    List<DiaryReminderDueSchedule> findDueDiaryReminderSchedules(
        ScheduleDay day,
        LocalTime fromInclusive,
        LocalTime toExclusive,
        Long notificationTypeId
    );
}