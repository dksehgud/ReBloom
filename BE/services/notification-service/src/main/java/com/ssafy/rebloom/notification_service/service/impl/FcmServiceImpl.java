package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.Notification;
import com.ssafy.rebloom.notification_service.domain.entity.UserFcmToken;
import com.ssafy.rebloom.notification_service.repository.UserFcmTokenRepository;
import com.ssafy.rebloom.notification_service.service.FcmService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmServiceImpl implements FcmService {
    private final UserFcmTokenRepository userFcmTokenRepository;

    @Override
    public boolean send(Notification notification) {
        List<UserFcmToken> tokens =
            userFcmTokenRepository.findAllByUserIdAndIsActiveTrue(notification.getReceiverId());

        if (tokens.isEmpty()) {
            return false;
        }

        for (UserFcmToken token : tokens) {
            // TODO Firebase Admin SDK 연동 후 실제 FCM 발송
            log.info("Send FCM. notificationId={}, tokenId={}", notification.getId(), token.getId());
        }

        return true;
    }
}
