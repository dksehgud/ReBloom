package com.ssafy.rebloom.notification_service.dto.response;

import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.notification_service.domain.enums.DiaryReminderQuickSelect;

public record DiaryReminderSettingResponseDto(
    boolean isEnabled,
    DiaryReminderQuickSelect quickSelect,
    Integer dailyFrequency,
    ListResponseDto<NotificationScheduleResponseDto> schedules
) {

}
