package com.ssafy.rebloom.notification_service.service;

import java.util.UUID;

public interface AnomalyAlertPolicyService {
    boolean tryAcquireAlertCoolTime(UUID childrenId);
}
