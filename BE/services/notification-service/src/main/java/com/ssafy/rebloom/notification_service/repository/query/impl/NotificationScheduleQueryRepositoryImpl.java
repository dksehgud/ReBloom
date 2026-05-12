package com.ssafy.rebloom.notification_service.repository.query.impl;

import static com.ssafy.rebloom.notification_service.domain.entity.QNotificationSchedule.notificationSchedule;
import static com.ssafy.rebloom.notification_service.domain.entity.QNotificationType.notificationType;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.dto.response.NotificationScheduleResponseDto;
import com.ssafy.rebloom.notification_service.repository.query.NotificationScheduleQueryRepository;
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
}