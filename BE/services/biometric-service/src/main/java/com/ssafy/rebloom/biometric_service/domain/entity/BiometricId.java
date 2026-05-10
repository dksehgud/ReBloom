package com.ssafy.rebloom.biometric_service.domain.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@Builder
@EqualsAndHashCode
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BiometricId implements Serializable {

    private UUID userId;
    private LocalDateTime tsStart;

    public static BiometricId create(UUID userId, LocalDateTime tsStart) {
        return BiometricId.builder()
            .userId(userId)
            .tsStart(tsStart)
            .build();
    }
}
