package com.ssafy.rebloom.auth_service.user.domain.entity;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
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

    @NotNull
    @Column(name = "hospital_address_detail", nullable = false)
    private String hospitalAddressDetail;

    @NotNull
    @Column(nullable = false)
    private String phone;

    @NotNull
    @Column(name = "code", nullable = false)
    private String code;

    @Builder(access = AccessLevel.PRIVATE)
    private Counselor(String email, String password, String name, String phone, String hospitalName, String hospitalAddress, String hospitalAddressDetail) {
        super(email, password, name, UserRole.COUNSELOR);
        this.hospitalName = hospitalName;
        this.hospitalAddress = hospitalAddress;
        this.hospitalAddressDetail = hospitalAddressDetail;
        this.phone = phone;
        this.code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public static Counselor createCounselor(String email, String password, String name, String phone, String hospitalName, String hospitalAddress, String hospitalAddressDetail) {
        return Counselor.builder()
            .email(email)
            .password(password)
            .name(name)
            .phone(phone)
            .hospitalName(hospitalName)
            .hospitalAddress(hospitalAddress)
            .hospitalAddressDetail(hospitalAddressDetail)
            .build();
    }

    public void updateCounselorProfile(
        String email,
        String name,
        String phone,
        String hospitalName,
        String hospitalAddress,
        String hospitalAddressDetail
    ) {
        updateProfile(email, name);
        this.hospitalName = hospitalName;
        this.hospitalAddress = hospitalAddress;
        this.hospitalAddressDetail = hospitalAddressDetail;
        this.phone = phone;
    }
}
