package com.ssafy.rebloom.biometric_service.domain.entity;

import com.ssafy.rebloom.event.dto.SleepDataEvent;
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

    @Column(nullable = false)
    private LocalDateTime asleep;

    @Column(name = "sleep_duration")
    private Double sleepDuration;

    private Double waso;

    @Column(name = "sleep_score")
    private Double sleepScore;

    @Column(name = "sleep_efficiency")
    private Double sleepEfficiency;

    @Column(name = "is_main_sleep")
    private Boolean isMainSleep;

    public static Sleep create(
        SleepId id,
        LocalDateTime asleep,
        Double sleepDuration,
        Double waso,
        Double sleepScore,
        Double sleepEfficiency
    ) {
        return Sleep.builder()
            .id(id)
            .asleep(asleep)
            .sleepDuration(sleepDuration)
            .waso(waso)
            .sleepScore(sleepScore)
            .sleepEfficiency(sleepEfficiency)
            .isMainSleep(null)
            .build();
    }

    public SleepDataEvent toEvent() {
        return new SleepDataEvent(
            id.getUserId(),
            id.getWakeup(),
            asleep,
            id.getWakeup().toLocalDate(),
            sleepDuration,
            waso,
            sleepScore,
            sleepEfficiency
        );
    }
}
