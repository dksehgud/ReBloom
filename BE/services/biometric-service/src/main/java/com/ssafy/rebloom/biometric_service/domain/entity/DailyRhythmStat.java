package com.ssafy.rebloom.biometric_service.domain.entity;

import com.ssafy.rebloom.common.entity.BaseTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@Table(name = "daily_rhythm_stats")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DailyRhythmStat extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @NotNull
    @Column(name = "sleep_start_time", nullable = false)
    private OffsetDateTime sleepStartTime;

    @NotNull
    @Column(name = "sleep_end_time", nullable = false)
    private OffsetDateTime sleepEndTime;

    @NotNull
    @Column(name = "sleep_midpoint", nullable = false)
    private OffsetDateTime sleepMidpoint;

    @NotNull
    @Column(name = "sleep_timing_variability", nullable = false)
    private Double sleepTimingVariability;

    @NotNull
    @Column(name = "crco_phase", nullable = false)
    private Double crcoPhase;

    @NotNull
    @Column(name = "crpo_phase", nullable = false)
    private Double crpoPhase;

    @NotNull
    @Column(name = "crco_sleep_misalignment", nullable = false)
    private Double crcoSleepMisalignment;

    @NotNull
    @Column(name = "crpo_sleep_misalignment", nullable = false)
    private Double crpoSleepMisalignment;

    @NotNull
    @Column(name = "internal_misalignment", nullable = false)
    private Double internalMisalignment;

    @NotNull
    @Column(name = "predicted_mood_score", nullable = false)
    private Double predictedMoodScore;

}
