package com.ssafy.rebloom.auth_service.user.repository.query;

import com.ssafy.rebloom.auth_service.user.dto.query.ParentReceiverDto;
import java.util.Optional;
import java.util.UUID;

public interface ParentQueryRepository {
    Optional<ParentReceiverDto> findParentReceiverByChildrenId(UUID childrenId);
}
