package com.ssafy.rebloom.biometric_service.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@Table(name = "anomalies")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Anomaly {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "ts_start", nullable = false)
    private LocalDateTime tsStart;

    @Column(name = "ts_end", nullable = false)
    private LocalDateTime tsEnd;

    private Double hr;
    private Double rmssd;
    private Double pnn50;

    @Column(name = "lf_hf")
    private Double lfHf;

    @Column(name = "acc_mag")
    private Double accMag;

    @Column(name = "hr_acc_ratio")
    private Double hrAccRatio;

    @Column(name = "is_anomaly")
    private Boolean isAnomaly;
}
