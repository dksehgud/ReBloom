package com.ssafy.rebloom.notification_service.event;

import com.ssafy.rebloom.notification_service.service.NotificationDeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationDeliveryEventListener {

    private final NotificationDeliveryService notificationDeliveryService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(NotificationDeliveryEvent event) {
        switch (event.deliveryChannel()) {
            case REALTIME -> notificationDeliveryService.deliverRealtime(event.realtimeMessage());
            case FCM -> notificationDeliveryService.deliverFcm(event.notificationId());
        }
    }
}