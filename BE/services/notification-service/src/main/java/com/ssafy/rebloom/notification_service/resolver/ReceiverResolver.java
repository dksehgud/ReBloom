package com.ssafy.rebloom.notification_service.resolver;

import com.ssafy.rebloom.notification_service.dto.ParentReceiverInfo;
import java.util.UUID;

public interface ReceiverResolver {

    ParentReceiverInfo resolveParentByChildrenId(UUID childrenId);
}