package com.ssafy.rebloom.auth_service.user.domain.entity;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "counselors")
@DiscriminatorValue("COUNSELOR")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Counselor extends User {

    @NotNull
    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;

    @NotNull
    @Column(name = "hospital_address", nullable = false)
    private String hospitalAddress;

    @Builder(access = AccessLevel.PRIVATE)
    private Counselor(String email, String password, String name, String phone, String hospitalName, String hospitalAddress) {
        super(email, password, name, phone, UserRole.COUNSELOR);
        this.hospitalName = hospitalName;
        this.hospitalAddress = hospitalAddress;
    }

    public static Counselor createCounselor(String email, String password, String name, String phone, String hospitalName, String hospitalAddress) {
        return Counselor.builder()
            .email(email)
            .password(password)
            .name(name)
            .phone(phone)
            .hospitalName(hospitalName)
            .hospitalAddress(hospitalAddress)
            .build();
    }
}
