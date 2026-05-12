package com.ssafy.rebloom.notification_service.domain.entity;

import com.ssafy.rebloom.common.entity.BaseTime;
import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@Builder
@Table(name = "notification_schedules")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationSchedule extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_type_id", nullable = false)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "day", nullable = false)
    private ScheduleDay day;

    @Column(nullable = false)
    private LocalTime time;

    public static NotificationSchedule create(
        UUID userId,
        NotificationType notificationType,
        ScheduleDay day,
        LocalTime time
    ) {
        return NotificationSchedule.builder()
            .userId(userId)
            .notificationType(notificationType)
            .day(day)
            .time(time)
            .build();
    }
}