package com.ssafy.rebloom.biometric_service.domain.entity;

import com.ssafy.rebloom.event.dto.BiometricDataEvent;
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
@Table(name = "biometrics")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Biometric {

    @EmbeddedId
    private BiometricId id;

    @Column(name = "ts_end", nullable = false)
    private LocalDateTime tsEnd;

    private Double hr;
    private Double ibi;
    private Double rmssd;
    private Double pnn50;

    @Column(name = "lf_hf")
    private Double lfHf;

    @Column(name = "acc_x_avg")
    private Double accXAvg;
    @Column(name = "acc_y_avg")
    private Double accYAvg;
    @Column(name = "acc_z_avg")
    private Double accZAvg;

    @Column(name = "acc_mag")
    private Double accMag;

    @Column(name = "hr_acc_ratio")
    private Double hrAccRatio;

    @Column(name = "missingness_score")
    private Double missingnessScore;

    public static Biometric create(
        BiometricId id,
        LocalDateTime tsEnd,
        Double hr,
        Double ibi,
        Double rmssd,
        Double pnn50,
        Double lfHf,
        Double accXAvg,
        Double accYAvg,
        Double accZAvg,
        Double accMag,
        Double hrAccRatio,
        Double missingnessScore
    ) {
        return Biometric.builder()
            .id(id)
            .tsEnd(tsEnd)
            .hr(hr)
            .ibi(ibi)
            .rmssd(rmssd)
            .pnn50(pnn50)
            .lfHf(lfHf)
            .accXAvg(accXAvg)
            .accYAvg(accYAvg)
            .accZAvg(accZAvg)
            .accMag(accMag)
            .hrAccRatio(hrAccRatio)
            .missingnessScore(missingnessScore)
            .build();
    }

    public static BiometricDataEvent toEvent(Biometric biometric) {
        return new BiometricDataEvent(
            biometric.id.getUserId(),
            biometric.id.getTsStart(),
            biometric.tsEnd,
            biometric.hr,
            biometric.ibi,
            biometric.rmssd,
            biometric.pnn50,
            biometric.lfHf,
            biometric.accXAvg,
            biometric.accYAvg,
            biometric.accZAvg,
            biometric.accMag,
            biometric.hrAccRatio,
            biometric.missingnessScore
        );
    }
}