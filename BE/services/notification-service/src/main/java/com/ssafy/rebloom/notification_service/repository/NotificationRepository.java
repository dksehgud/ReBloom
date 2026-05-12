package com.ssafy.rebloom.notification_service.repository;

import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Slice<Notification> findByReceiverIdOrderByCreatedAtDesc(UUID receiverId, Pageable pageable);

    Slice<Notification> findByReceiverIdAndReadOrderByCreatedAtDesc(
        UUID receiverId,
        boolean isRead,
        Pageable pageable
    );
    Optional<Notification> findByIdAndReceiverId(
        Long id,
        UUID receiverId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Notification n
           SET n.isRead = true
         WHERE n.receiverId = :receiverId
           AND n.isRead = false
        """)
    int markAllAsReadByReceiverId(@Param("receiverId") UUID receiverId);
}