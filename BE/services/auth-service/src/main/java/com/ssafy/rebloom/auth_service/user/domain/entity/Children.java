package com.ssafy.rebloom.auth_service.user.domain.entity;

import com.ssafy.rebloom.auth_service.user.domain.enums.Gender;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@Table(name = "childrens")
@DiscriminatorValue("CHILDREN")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Children extends User {

    @NotNull
    @Column(nullable = false)
    private String birth;

    @NotNull
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private Gender gender;

    @NotNull
    @Column(nullable = false)
    private String address;

    @NotNull
    @Column(name = "address_detail", nullable = false)
    private String addressDetail;

    @Builder(access = AccessLevel.PRIVATE)
    private Children(String email, String password, String name, String phone, String birth, Gender gender, String address, String addressDetail) {
        super(email, password, name, phone, UserRole.CHILDREN);
        this.birth = birth;
        this.gender = gender;
        this.address = address;
        this.addressDetail = addressDetail;
    }

    public static Children createChildren(String email, String password, String name, String phone, String birth, Gender gender, String address, String addressDetail) {
        return Children.builder()
            .email(email)
            .password(password)
            .name(name)
            .phone(phone)
            .birth(birth)
            .gender(gender)
            .address(address)
            .addressDetail(addressDetail)
            .build();
    }
}
