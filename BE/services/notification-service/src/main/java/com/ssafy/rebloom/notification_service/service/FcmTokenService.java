package com.ssafy.rebloom.notification_service.service;

import com.ssafy.rebloom.notification_service.dto.request.FcmTokenDeactivateRequestDto;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenRegisterRequestDto;
import java.util.UUID;

public interface FcmTokenService {

    void register(UUID userId, FcmTokenRegisterRequestDto request);

    void deactivate(UUID userId, FcmTokenDeactivateRequestDto request);
}
