package com.ssafy.rebloom.notification_service.repository;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, Long> {
}
