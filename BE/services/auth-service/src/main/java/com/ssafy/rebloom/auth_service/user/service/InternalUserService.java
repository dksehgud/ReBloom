package com.ssafy.rebloom.auth_service.user.service;

import com.ssafy.rebloom.auth_service.user.dto.response.ChildGpsResponseDto;
import java.util.UUID;

public interface InternalUserService {

    ChildGpsResponseDto getChildGpsInfo(UUID childId);
}
