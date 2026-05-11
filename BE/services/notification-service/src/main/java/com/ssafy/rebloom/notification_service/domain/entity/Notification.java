package com.ssafy.rebloom.notification_service.domain.entity;

import com.ssafy.rebloom.common.entity.BaseTime;
import com.ssafy.rebloom.notification_service.domain.enums.DeliveryStatus;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@Table(name = "notifications")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;

    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @NotNull
    @Column(name = "content", nullable = false)
    private String content;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false)
    private DeliveryStatus deliveryStatus;

    @Column(name = "external_reference_id")
    private String externalReferenceId;

    @NotNull
    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    public static Notification create(
        UUID userId,
        NotificationType notificationType,
        DeliveryStatus deliveryStatus,
        String externalReferenceId,
        Boolean isRead
    ) {
        return Notification.builder()
            .userId(userId)
            .notificationType(notificationType)
            .title("주의 필요")
            .content(String.format("지금 한번 %s에게 관심을 표현해볼까요?"))
            .deliveryStatus(deliveryStatus)
            .externalReferenceId(externalReferenceId)
            .isRead(isRead)
            .build();
    }
}