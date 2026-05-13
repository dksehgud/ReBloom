package com.ssafy.rebloom.notification_service.service.impl;

import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.ssafy.rebloom.notification_service.config.property.FirebaseProperties;
import com.ssafy.rebloom.notification_service.constants.Constants;
import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.entity.UserFcmToken;
import com.ssafy.rebloom.notification_service.repository.UserFcmTokenRepository;
import com.ssafy.rebloom.notification_service.service.FcmService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmServiceImpl implements FcmService {

    private final UserFcmTokenRepository userFcmTokenRepository;
    private final FirebaseMessaging firebaseMessaging;
    private final FirebaseProperties firebaseProperties;

    @Override
    @Transactional
    public boolean send(Notification notification) {
        List<UserFcmToken> tokens =
            userFcmTokenRepository.findAllByUserIdAndActiveTrue(notification.getReceiverId());

        if (tokens.isEmpty()) {
            log.info(
                "No active FCM token. notificationId={}, receiverId={}",
                notification.getId(),
                notification.getReceiverId()
            );
            return false;
        }

        int successCount = 0;

        for (UserFcmToken token : tokens) {
            if (sendToToken(notification, token)) {
                successCount++;
            }
        }

        log.info(
            "FCM send completed. notificationId={}, receiverId={}, successCount={}, failureCount={}",
            notification.getId(),
            notification.getReceiverId(),
            successCount,
            tokens.size() - successCount
        );

        return successCount > 0;
    }

    private boolean sendToToken(Notification notification, UserFcmToken token) {
        try {
            Message message = buildMessage(notification, token.getFcmToken());
            String messageId = firebaseMessaging.send(message, firebaseProperties.isDryRun());

            log.info(
                "FCM sent. notificationId={}, tokenId={}, messageId={}, dryRun={}",
                notification.getId(),
                token.getId(),
                messageId,
                firebaseProperties.isDryRun()
            );

            return true;
        } catch (FirebaseMessagingException e) {
            handleFirebaseMessagingException(notification, token, e);
            return false;
        } catch (RuntimeException e) {
            log.error(
                "Unexpected FCM send failure. notificationId={}, tokenId={}",
                notification.getId(),
                token.getId(),
                e
            );
            return false;
        }
    }

    private Message buildMessage(Notification notification, String fcmToken) {
        NotificationPayload payload = notification.getNotificationPayload();

        return Message.builder()
            .setToken(fcmToken)
            .setNotification(com.google.firebase.messaging.Notification.builder()
                .setTitle(nullToBlank(payload.getTitle()))
                .setBody(nullToBlank(payload.getContent()))
                .build())
            .setAndroidConfig(AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .setNotification(AndroidNotification.builder()
                    .setChannelId(Constants.ANDROID_CHANNEL_ID)
                    .setTitle(nullToBlank(payload.getTitle()))
                    .setBody(nullToBlank(payload.getContent()))
                    .build())
                .build())
            .setApnsConfig(ApnsConfig.builder()
                .putHeader("apns-priority", "10")
                .setAps(Aps.builder()
                    .setSound("default")
                    .build())
                .build())
            .putAllData(buildData(notification))
            .build();
    }

    private Map<String, String> buildData(Notification notification) {
        NotificationPayload payload = notification.getNotificationPayload();
        Map<String, String> data = new LinkedHashMap<>();

        put(data, "notificationId", notification.getId());
        put(data, "receiverId", notification.getReceiverId());
        put(data, "notificationType", notification.getNotificationType().getName());
        put(data, "title", payload.getTitle());
        put(data, "content", payload.getContent());
        put(data, "childrenId", payload.getChildrenId());
        put(data, "childrenName", payload.getChildrenName());
        put(data, "childrenReportId", payload.getChildrenReportId());
        put(data, "parentId", payload.getParentId());
        put(data, "counselorId", payload.getCounselorId());
        put(data, "counselorName", payload.getCounselorName());
        put(data, "depressionScore", payload.getDepressionScore());
        put(data, "depressionScoreText", payload.getDepressionScoreText());

        return data;
    }

    private void handleFirebaseMessagingException(
        Notification notification,
        UserFcmToken token,
        FirebaseMessagingException e
    ) {
        MessagingErrorCode messagingErrorCode = e.getMessagingErrorCode();

        if (isUnregisteredToken(messagingErrorCode)) {
            token.deactivate();
        }

        log.warn(
            "FCM send failed. notificationId={}, tokenId={}, messagingErrorCode={}, errorCode={}, deactivated={}",
            notification.getId(),
            token.getId(),
            messagingErrorCode,
            e.getErrorCode(),
            isUnregisteredToken(messagingErrorCode),
            e
        );
    }

    private boolean isUnregisteredToken(MessagingErrorCode messagingErrorCode) {
        return messagingErrorCode == MessagingErrorCode.UNREGISTERED;
    }

    private void put(Map<String, String> data, String key, Object value) {
        if (value == null) {
            return;
        }

        data.put(key, String.valueOf(value));
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }
}