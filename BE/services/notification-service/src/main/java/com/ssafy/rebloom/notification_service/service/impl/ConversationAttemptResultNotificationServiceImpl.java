package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.request.ConversationAttemptResultRequestDto;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.ConversationAttemptResultNotificationService;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationAttemptResultNotificationServiceImpl
    implements ConversationAttemptResultNotificationService {

    private final NotificationService notificationService;
    private final AuthServiceResolveService authServiceResolveService;

    @Override
    @Transactional
    public void handleConversationAttemptResult(ConversationAttemptResultRequestDto request) {
        UUID childrenId =
            authServiceResolveService.resolveChildrenIdByDeviceSerial(request.serialNumber());

        ParentReceiverInfo receiverInfo =
            authServiceResolveService.resolveParentByChildrenId(childrenId);

        if (Boolean.TRUE.equals(request.conversationStarted())) {
            sendConversationStartedAlert(receiverInfo.parentId(), childrenId);
            return;
        }

        sendConversationSkippedAlert(receiverInfo.parentId(), childrenId);
    }

    private void sendConversationStartedAlert(UUID parentId, UUID childrenId) {
        NotificationPayload payload = NotificationPayload.builder()
            .title("대화를 시작했어요")
            .content("자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.")
            .parentId(parentId)
            .childrenId(childrenId)
            .build();

        notificationService.send(new NotificationCommand(
            parentId,
            ReceiverRole.PARENT,
            NotificationCode.CONVERSATION_ALERT,
            payload
        ));
    }

    private void sendConversationSkippedAlert(UUID parentId, UUID childrenId) {
        NotificationPayload payload = NotificationPayload.builder()
            .title("대화를 시작하지 못했어요")
            .content("자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.")
            .parentId(parentId)
            .childrenId(childrenId)
            .build();

        notificationService.send(new NotificationCommand(
            parentId,
            ReceiverRole.PARENT,
            NotificationCode.CONVERSATION_ALERT,
            payload
        ));
    }
}