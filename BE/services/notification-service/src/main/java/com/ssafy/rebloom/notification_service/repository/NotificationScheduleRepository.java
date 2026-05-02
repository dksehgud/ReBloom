package com.ssafy.rebloom.notification_service.repository;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationScheduleRepository extends JpaRepository<NotificationSchedule, Long> {
}