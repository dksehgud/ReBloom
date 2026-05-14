package com.ssafy.rebloom.notification_service.repository;

import com.ssafy.rebloom.notification_service.domain.entity.UserFcmToken;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {

    List<UserFcmToken> findAllByUserIdAndIsActiveTrue(UUID userId);

    Optional<UserFcmToken> findByFcmToken(String fcmToken);

    Optional<UserFcmToken> findByUserIdAndFcmToken(UUID userId, String fcmToken);
}
