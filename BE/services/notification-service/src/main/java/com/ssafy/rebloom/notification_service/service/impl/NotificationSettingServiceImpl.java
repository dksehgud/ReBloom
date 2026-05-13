package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationSchedule;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationSetting;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.DiaryReminderQuickSelect;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import com.ssafy.rebloom.notification_service.dto.request.DiaryReminderSettingUpdateRequestDto;
import com.ssafy.rebloom.notification_service.dto.response.DiaryReminderSettingResponseDto;
import com.ssafy.rebloom.notification_service.dto.response.NotificationScheduleResponseDto;
import com.ssafy.rebloom.notification_service.repository.NotificationScheduleRepository;
import com.ssafy.rebloom.notification_service.repository.NotificationSettingRepository;
import com.ssafy.rebloom.notification_service.resolver.NotificationTypeResolver;
import com.ssafy.rebloom.notification_service.service.NotificationSettingService;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationSettingServiceImpl implements NotificationSettingService {

    private final NotificationSettingRepository notificationSettingRepository;
    private final NotificationScheduleRepository notificationScheduleRepository;
    private final NotificationTypeResolver notificationTypeResolver;

    @Override
    public boolean isEnabled(UUID userId) {
        return notificationSettingRepository.findByUserId(userId)
            .map(NotificationSetting::isEnabled)
            .orElse(true);
    }

    @Override
    public DiaryReminderSettingResponseDto getDiaryReminderSetting(UUID userId) {
        boolean enabled = isEnabled(userId);
        List<NotificationScheduleResponseDto> schedules = notificationScheduleRepository.findDiaryReminderSchedules(
            userId);

        return new DiaryReminderSettingResponseDto(
            enabled,
            calculateQuickSelect(schedules),
            calculateDailyFrequency(schedules),
            ListResponseDto.from(schedules)
        );
    }

    @Override
    @Transactional
    public DiaryReminderSettingResponseDto updateDiaryReminderSetting(
        UUID userId,
        DiaryReminderSettingUpdateRequestDto request
    ) {
        NotificationSetting setting = notificationSettingRepository.findByUserId(userId)
            .orElseGet(() -> notificationSettingRepository.save(
                NotificationSetting.create(userId, request.isEnabled())
            ));

        setting.updateEnabled(request.isEnabled());

        NotificationType diaryReminderType =
            notificationTypeResolver.resolve(NotificationCode.DIARY_REMINDER);

        notificationScheduleRepository.deleteDiaryReminderSchedules(
            userId,
            diaryReminderType.getId()
        );

        List<NotificationSchedule> newSchedules = request.days().stream()
            .distinct()
            .flatMap(day -> request.times().stream()
                .distinct()
                .map(time -> NotificationSchedule.create(
                    userId,
                    diaryReminderType,
                    day,
                    time
                )))
            .toList();

        notificationScheduleRepository.saveAll(newSchedules);

        List<NotificationScheduleResponseDto> schedules = notificationScheduleRepository.findDiaryReminderSchedules(
            userId);
        return new DiaryReminderSettingResponseDto(
            setting.isEnabled(),
            calculateQuickSelect(schedules),
            calculateDailyFrequency(schedules),
            ListResponseDto.from(schedules)
        );
    }

    private DiaryReminderQuickSelect calculateQuickSelect(
        List<NotificationScheduleResponseDto> schedules) {
        Set<ScheduleDay> days = schedules.stream()
            .map(NotificationScheduleResponseDto::day)
            .collect(Collectors.toCollection(() -> EnumSet.noneOf(ScheduleDay.class)));

        if (days.equals(EnumSet.allOf(ScheduleDay.class))) {
            return DiaryReminderQuickSelect.EVERYDAY;
        }

        if (days.equals(EnumSet.of(
            ScheduleDay.MONDAY,
            ScheduleDay.TUESDAY,
            ScheduleDay.WEDNESDAY,
            ScheduleDay.THURSDAY,
            ScheduleDay.FRIDAY
        ))) {
            return DiaryReminderQuickSelect.WEEKDAYS;
        }

        if (days.equals(EnumSet.of(ScheduleDay.SATURDAY, ScheduleDay.SUNDAY))) {
            return DiaryReminderQuickSelect.WEEKENDS;
        }

        return DiaryReminderQuickSelect.CUSTOM;
    }

    private Integer calculateDailyFrequency(
        List<NotificationScheduleResponseDto> schedules
    ) {
        if (schedules.isEmpty()) {
            return 0;
        }

        Map<ScheduleDay, Long> countByDay = schedules.stream()
            .collect(Collectors.groupingBy(
                NotificationScheduleResponseDto::day,
                Collectors.counting()
            ));

        Set<Long> distinctCounts = Set.copyOf(countByDay.values());

        if (distinctCounts.size() != 1) {
            return null;
        }

        return distinctCounts.iterator().next().intValue();
    }
}
