package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.request.DiaryReminderSettingUpdateRequestDto;
import com.ssafy.rebloom.notification_service.dto.response.DiaryReminderSettingResponseDto;
import java.util.UUID;

public interface NotificationSettingService {

    boolean isEnabled(UUID userId);

    DiaryReminderSettingResponseDto getDiaryReminderSetting(UUID userId);

    DiaryReminderSettingResponseDto updateDiaryReminderSetting(
        UUID userId,
        DiaryReminderSettingUpdateRequestDto request
    );
}
