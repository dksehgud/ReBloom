package com.ssafy.rebloom.notification_service.service.impl;

import com.ssafy.rebloom.notification_service.domain.entity.UserFcmToken;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenDeactivateRequestDto;
import com.ssafy.rebloom.notification_service.dto.request.FcmTokenRegisterRequestDto;
import com.ssafy.rebloom.notification_service.repository.UserFcmTokenRepository;
import com.ssafy.rebloom.notification_service.service.FcmTokenService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FcmTokenServiceImpl implements FcmTokenService {

    private final UserFcmTokenRepository userFcmTokenRepository;

    @Override
    @Transactional
    public void register(UUID userId, FcmTokenRegisterRequestDto request) {
        UserFcmToken token = findOrCreateToken(userId, request.fcmToken());

        token.changeUser(userId);
        token.activate();
    }

    @Override
    @Transactional
    public void deactivate(UUID userId, FcmTokenDeactivateRequestDto request) {
        userFcmTokenRepository.findByUserIdAndFcmToken(userId, request.fcmToken())
            .ifPresent(UserFcmToken::deactivate);
    }

    private UserFcmToken findOrCreateToken(UUID userId, String fcmToken) {
        return userFcmTokenRepository.findByFcmToken(fcmToken)
            .orElseGet(() -> saveNewToken(userId, fcmToken));
    }

    private UserFcmToken saveNewToken(UUID userId, String fcmToken) {
        try {
            return userFcmTokenRepository.saveAndFlush(UserFcmToken.create(userId, fcmToken));
        } catch (DataIntegrityViolationException exception) {
            return userFcmTokenRepository.findByFcmToken(fcmToken)
                .orElseThrow(() -> exception);
        }
    }
}
