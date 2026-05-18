package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.event.dto.ParentReportCommentCreatedEvent;
import com.ssafy.rebloom.event.dto.ParentReportCreatedEvent;
import com.ssafy.rebloom.notification_service.domain.entity.NotificationPayload;
import com.ssafy.rebloom.notification_service.domain.enums.NotificationCode;
import com.ssafy.rebloom.notification_service.domain.enums.ReceiverRole;
import com.ssafy.rebloom.notification_service.dto.CounselorReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.NotificationCommand;
import com.ssafy.rebloom.notification_service.service.AuthServiceResolveService;
import com.ssafy.rebloom.notification_service.service.NotificationIdempotencyService;
import com.ssafy.rebloom.notification_service.service.NotificationService;
import com.ssafy.rebloom.notification_service.service.ParentReportNotificationService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentReportNotificationServiceImpl implements ParentReportNotificationService {

    private final AuthServiceResolveService authServiceResolveService;
    private final NotificationService notificationService;
    private final NotificationIdempotencyService notificationIdempotencyService;

    @Override
    @Transactional
    public void handleParentReportCreated(
        ParentReportCreatedEvent event,
        String eventId,
        String idempotencyKey
    ) {
        if (!notificationIdempotencyService.tryStart(idempotencyKey, eventId)) {
            log.info(
                "Duplicated parent report created event ignored. eventId={}, idempotencyKey={}",
                eventId,
                idempotencyKey
            );
            return;
        }

        Optional<CounselorReceiverInfo> receiver =
            authServiceResolveService.resolveCounselorByChildrenId(event.childrenId());

        if (receiver.isEmpty()) {
            notificationIdempotencyService.markCompleted(idempotencyKey);
            return;
        }

        // 알림 전송
        CounselorReceiverInfo counselor = receiver.get();

        NotificationPayload payload = NotificationPayload.builder()
            .title("새 부모 리포트가 등록되었습니다")
            .content("상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.")
            .childrenId(event.childrenId())
            .childrenReportId(event.reportId())
            .parentId(event.parentId())
            .counselorId(counselor.counselorId())
            .counselorName(counselor.counselorName())
            .build();

        notificationService.send(
            new NotificationCommand(
                counselor.counselorId(),
                ReceiverRole.COUNSELOR,
                NotificationCode.PARENT_REPORT_NEW,
                payload
            )
        );

        notificationIdempotencyService.markCompleted(idempotencyKey);
    }

    @Override
    @Transactional
    public void handleParentReportCommentCreated(
        ParentReportCommentCreatedEvent event,
        String eventId,
        String idempotencyKey
    ) {
        if (!notificationIdempotencyService.tryStart(idempotencyKey, eventId)) {
            log.info(
                "Duplicated parent report comment created event ignored. eventId={}, idempotencyKey={}",
                eventId,
                idempotencyKey
            );
            return;
        }

        NotificationPayload payload = NotificationPayload.builder()
            .title("상담사 코멘트가 등록되었습니다")
            .content("작성한 부모 리포트에 상담사 코멘트가 등록되었습니다.")
            .childrenId(event.childrenId())
            .childrenReportId(event.reportId())
            .parentId(event.parentId())
            .counselorId(event.counselorId())
            .build();

        notificationService.send(
            new NotificationCommand(
                event.parentId(),
                ReceiverRole.PARENT,
                NotificationCode.PARENT_REPORT_REPLY,
                payload
            )
        );

        notificationIdempotencyService.markCompleted(idempotencyKey);
    }
}