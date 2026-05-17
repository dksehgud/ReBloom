package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationType;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import com.ssafy.rebloom.notification_service.dto.DiaryReminderDueSchedule;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.repository.NotificationScheduleRepository;
import com.ssafy.rebloom.notification_service.service.DiaryReminderScheduleService;
import com.ssafy.rebloom.notification_service.service.NotificationAlertSender;
import com.ssafy.rebloom.notification_service.service.NotificationIdempotencyService;
import com.ssafy.rebloom.notification_service.service.NotificationTypeService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiaryReminderScheduleServiceImpl implements DiaryReminderScheduleService {

    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter TIME_FORMATTER =
        DateTimeFormatter.ofPattern("HHmm");

    private final NotificationScheduleRepository notificationScheduleRepository;
    private final NotificationTypeService notificationTypeService;
    private final NotificationAlertSender notificationAlertSender;
    private final NotificationIdempotencyService notificationIdempotencyService;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void sendDueReminders() {
        LocalDateTime now = LocalDateTime.now(Constants.SEOUL_ZONE_ID)
            .withSecond(0)
            .withNano(0);

        ScheduleDay today = ScheduleDay.valueOf(now.getDayOfWeek().name());
        LocalTime fromInclusive = now.toLocalTime();
        LocalTime toExclusive = fromInclusive.plusMinutes(1);

        NotificationType diaryReminderType =
            notificationTypeService.resolve(NotificationCode.DIARY_REMINDER);

        List<DiaryReminderDueSchedule> dueSchedules =
            notificationScheduleRepository.findDueDiaryReminderSchedules(
                today,
                fromInclusive,
                toExclusive,
                diaryReminderType.getId()
            );

        if (dueSchedules.isEmpty()) {
            return;
        }

        log.info(
            "Due diary reminder schedules found. day={}, from={}, to={}, count={}",
            today,
            fromInclusive,
            toExclusive,
            dueSchedules.size()
        );

        dueSchedules.forEach(schedule -> sendOne(now.toLocalDate(), schedule));
    }

    private void sendOne(
        LocalDate today,
        DiaryReminderDueSchedule schedule
    ) {
        String idempotencyKey = idempotencyKey(today, schedule);

        if (!notificationIdempotencyService.tryStart(idempotencyKey, idempotencyKey)) {
            log.debug(
                "Duplicated diary reminder ignored. scheduleId={}, userId={}, key={}",
                schedule.scheduleId(),
                schedule.userId(),
                idempotencyKey
            );
            return;
        }

        try {
            TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
            transactionTemplate.executeWithoutResult(status -> notificationAlertSender.send(
                new NotificationCommand(
                    schedule.userId(),
                    ReceiverRole.CHILDREN,
                    NotificationCode.DIARY_REMINDER,
                    payload(schedule)
                )
            ));

            notificationIdempotencyService.markCompleted(idempotencyKey);
        } catch (RuntimeException e) {
            notificationIdempotencyService.clear(idempotencyKey);

            log.error(
                "Failed to send diary reminder. scheduleId={}, userId={}, key={}",
                schedule.scheduleId(),
                schedule.userId(),
                idempotencyKey,
                e
            );
        }
    }

    private NotificationPayload payload(DiaryReminderDueSchedule schedule) {
        return NotificationPayload.builder()
            .title("일기 작성 시간이에요")
            .content("오늘의 마음을 기록해볼까요?")
            .childrenId(schedule.userId())
            .build();
    }

    private String idempotencyKey(
        LocalDate today,
        DiaryReminderDueSchedule schedule
    ) {
        return Constants.DIARY_REMINDER_IDEMPOTENCY_KEY_PREFIX
               + schedule.userId()
               + ":"
               + today.format(DATE_FORMATTER)
               + ":"
               + schedule.time().format(TIME_FORMATTER);
    }
}