package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.UserFcmToken;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenDeactivateRequestDto;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenRegisterRequestDto;
import com.ssafy.rebloom.notification_service.repository.UserFcmTokenRepository;
import com.ssafy.rebloom.notification_service.service.FcmTokenService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FcmTokenServiceImpl implements FcmTokenService {

    private final UserFcmTokenRepository userFcmTokenRepository;

    @Override
    @Transactional
    public void register(UUID userId, FcmTokenRegisterRequestDto request) {
        userFcmTokenRepository.upsertActiveToken(userId, request.fcmToken());
    }

    @Override
    @Transactional
    public void deactivate(UUID userId, FcmTokenDeactivateRequestDto request) {
        userFcmTokenRepository.findByUserIdAndFcmToken(userId, request.fcmToken())
            .ifPresent(UserFcmToken::deactivate);
    }
}
