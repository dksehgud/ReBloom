package com.ssafy.rebloom.notification_service.repository.query.impl;

import static com.ssafy.rebloom.notification_service.domain.entity.QNotificationSchedule.notificationSchedule;
import static com.ssafy.rebloom.notification_service.domain.entity.QNotificationSetting.notificationSetting;
import static com.ssafy.rebloom.notification_service.domain.entity.QNotificationType.notificationType;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import com.ssafy.rebloom.notification_service.dto.DiaryReminderDueSchedule;
import com.ssafy.rebloom.notification_service.dto.response.NotificationScheduleResponseDto;
import com.ssafy.rebloom.notification_service.repository.query.NotificationScheduleQueryRepository;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class NotificationScheduleQueryRepositoryImpl implements NotificationScheduleQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<NotificationScheduleResponseDto> findDiaryReminderSchedules(UUID userId) {
        return jpaQueryFactory
            .select(Projections.constructor(
                NotificationScheduleResponseDto.class,
                notificationSchedule.day,
                notificationSchedule.time
            ))
            .from(notificationSchedule)
            .join(notificationSchedule.notificationType, notificationType)
            .where(
                notificationSchedule.userId.eq(userId),
                notificationType.name.eq(NotificationCode.DIARY_REMINDER.name())
            )
            .orderBy(
                notificationSchedule.day.asc(),
                notificationSchedule.time.asc()
            )
            .fetch();
    }

    @Override
    public long deleteDiaryReminderSchedules(UUID userId, Long notificationTypeId) {
        return jpaQueryFactory
            .delete(notificationSchedule)
            .where(
                notificationSchedule.userId.eq(userId),
                notificationSchedule.notificationType.id.eq(notificationTypeId)
            )
            .execute();
    }

    @Override
    public List<DiaryReminderDueSchedule> findDueDiaryReminderSchedules(
        ScheduleDay day,
        LocalTime fromInclusive,
        LocalTime toExclusive,
        Long notificationTypeId
    ) {
        return jpaQueryFactory
            .select(Projections.constructor(
                DiaryReminderDueSchedule.class,
                notificationSchedule.id,
                notificationSchedule.userId,
                notificationSchedule.time
            ))
            .from(notificationSchedule)
            .join(notificationSchedule.notificationType, notificationType)
            .leftJoin(notificationSetting)
            .on(notificationSetting.userId.eq(notificationSchedule.userId))
            .where(
                notificationSchedule.day.eq(day),
                notificationSchedule.notificationType.id.eq(notificationTypeId),
                timeWindow(fromInclusive, toExclusive),
                notificationSetting.id.isNull()
                    .or(notificationSetting.isEnabled.isTrue())
            )
            .orderBy(notificationSchedule.id.asc())
            .fetch();
    }

    private BooleanExpression timeWindow(
        LocalTime fromInclusive,
        LocalTime toExclusive
    ) {
        if (toExclusive.isAfter(fromInclusive)) {
            return notificationSchedule.time.goe(fromInclusive)
                .and(notificationSchedule.time.lt(toExclusive));
        }

        return notificationSchedule.time.goe(fromInclusive);
    }
}