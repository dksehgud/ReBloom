package com.ssafy.rebloom.notification_service.repository;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationSchedule;
import com.ssafy.rebloom.notification_service.repository.query.NotificationScheduleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationScheduleRepository extends JpaRepository<NotificationSchedule, Long>,
    NotificationScheduleQueryRepository {


}