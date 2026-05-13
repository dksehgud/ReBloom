package com.ssafy.rebloom.biometric_service.client;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthAccessClient {

    private final InternalAuthClient internalAuthClient;

    public void validateCounselorChildAccess(UUID counselorId, UUID childId) {
        internalAuthClient.validateCounselorChildAccess(counselorId, childId);
    }

    public void validateParentChildAccess(UUID parentId, UUID childId) {
        internalAuthClient.validateParentChildAccess(parentId, childId);
    }

    public Integer getChildAge(UUID childId) {
        return internalAuthClient.getChildAge(childId).getData().age();
    }
}
