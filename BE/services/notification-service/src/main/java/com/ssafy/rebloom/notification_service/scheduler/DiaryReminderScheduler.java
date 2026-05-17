package com.ssafy.rebloom.notification_service.scheduler;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.service.DiaryReminderScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DiaryReminderScheduler {

    private final DiaryReminderScheduleService diaryReminderScheduleService;

    @Scheduled(
        cron = Constants.DIARY_REMINDER_SCHEDULER_CRON,
        zone = Constants.DIARY_REMINDER_SCHEDULER_ZONE
    )
    @SchedulerLock(
        name = Constants.DIARY_REMINDER_SCHEDULER_LOCK_NAME,
        lockAtLeastFor = Constants.DIARY_REMINDER_LOCK_AT_LEAST_FOR,
        lockAtMostFor = Constants.DIARY_REMINDER_LOCK_AT_MOST_FOR
    )
    public void sendDueDiaryReminders() {
        try {
            diaryReminderScheduleService.sendDueReminders();
        } catch (RuntimeException e) {
            log.error("Failed to process diary reminder schedules.", e);
        }
    }
}