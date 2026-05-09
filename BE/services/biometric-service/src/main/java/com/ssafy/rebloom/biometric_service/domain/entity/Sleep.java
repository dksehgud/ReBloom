package com.ssafy.rebloom.biometric_service.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@Table(name = "sleeps")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sleep {

    @EmbeddedId
    private SleepId id;

    private LocalDateTime asleep;
    private LocalDateTime wakeup;

    @Column(name = "sleep_duration")
    private Double sleepDuration;

    private Double waso;

    @Column(name = "sleep_score")
    private Double sleepScore;

    @Column(name = "sleep_efficiency")
    private Double sleepEfficiency;

}
