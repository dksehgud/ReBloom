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
@Table(name = "parents")
@DiscriminatorValue("PARENT")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Parent extends User {

    @NotNull
    @Column(nullable = false)
    private String code;

    @Builder(access = AccessLevel.PRIVATE)
    private Parent(String email, String password, String name) {
        super(email, password, name, UserRole.PARENT);
        // 부모 코드는 8자 Random UUID
        this.code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public static Parent createParent(String email, String password, String name) {
        return Parent.builder()
            .email(email)
            .password(password)
            .name(name)
            .build();
    }
}