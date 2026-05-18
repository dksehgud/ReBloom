package com.ssafy.rebloom.notification_service.repository;

import com.ssafy.rebloom.notification_service.domain.entity.UserFcmToken;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {

    List<UserFcmToken> findAllByUserIdAndIsActiveTrue(UUID userId);

    Optional<UserFcmToken> findByFcmToken(String fcmToken);

    Optional<UserFcmToken> findByUserIdAndFcmToken(UUID userId, String fcmToken);

    @Modifying
    @Query(
        value = """
            INSERT INTO user_fcm_tokens (
                user_id,
                fcm_token,
                is_active,
                created_at,
                modified_at
            )
            VALUES (
                :userId,
                :fcmToken,
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (fcm_token)
            DO UPDATE SET
                user_id = EXCLUDED.user_id,
                is_active = true,
                modified_at = CURRENT_TIMESTAMP
            """,
        nativeQuery = true
    )
    int upsertActiveToken(
        @Param("userId") UUID userId,
        @Param("fcmToken") String fcmToken
    );
}
