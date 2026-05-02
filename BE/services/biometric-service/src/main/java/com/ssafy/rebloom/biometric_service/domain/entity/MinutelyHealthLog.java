package com.ssafy.rebloom.biometric_service.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@Table(name = "minutely_health_logs")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class MinutelyHealthLog {

    @EmbeddedId
    private MinutelyHealthLogId id;

    @NotNull
    @Column(name = "current_hr", nullable = false)
    private Integer currentHr;

    @NotNull
    @Column(name = "current_hrv", nullable = false)
    private Double currentHrv;

    @NotNull
    @Column(name = "current_acc_mag", nullable = false)
    private Double currentAccMag;

    @NotNull
    @Column(name = "hr_acc_ratio", nullable = false)
    private Double hrAccRatio;

    @Column(name = "hrv_drop_rate_5m")
    private Double hrvDropRate5m;

    @NotNull
    @Column(name = "lethargy_duration", nullable = false)
    private Integer lethargyDuration;

    @Column(name = "acc_variance_5m")
    private Double accVariance5m;
}