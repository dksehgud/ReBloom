package com.ssafy.rebloom.auth_service.user.service;

import com.ssafy.rebloom.auth_service.user.dto.response.ActiveChildResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildAgeResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildConnectedCounselorResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildGpsResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildrenIotInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentReceiverResponseDto;
import java.util.List;
import java.util.UUID;

public interface InternalUserService {

    ChildGpsResponseDto getChildGpsInfo(UUID childId);

    ChildAgeResponseDto getChildAge(UUID childId);

    ChildrenIotInfoResponseDto getChildrenIotInfo(UUID childrenId);

    ChildConnectedCounselorResponseDto getConnectedCounselorByChild(UUID childrenId);

    List<ActiveChildResponseDto> getActiveChildren();

    ParentReceiverResponseDto getParentReceiverByChildrenId(UUID childrenId);
}
