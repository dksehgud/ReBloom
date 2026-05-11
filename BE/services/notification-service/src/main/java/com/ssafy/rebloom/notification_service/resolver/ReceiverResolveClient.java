package com.ssafy.rebloom.notification_service.resolver;

import com.ssafy.rebloom.common.dto.BaseResponse;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import com.ssafy.rebloom.notification_service.client.AuthServiceInternalClient;
import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import com.ssafy.rebloom.notification_service.dto.response.ParentReceiverResponseDto;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReceiverResolveClient {

    private final AuthServiceInternalClient authServiceInternalClient;

    public ParentReceiverInfo resolveParentByChildrenId(UUID childrenId) {
        BaseResponse<ParentReceiverResponseDto> response =
            authServiceInternalClient.getParentReceiver(childrenId);

        ParentReceiverResponseDto data = response.getData();

        if (data == null || !data.connected()) {
            throw new CustomException("부모님과의 관계를 찾을 수 없습니다.", ErrorCode.PARENT_RELATION_NOT_FOUND);
        }

        return new ParentReceiverInfo(
            data.parentId(),
            data.childrenId(),
            data.childrenName()
        );
    }
}
