package com.ssafy.rebloom.auth_service.user.domain.entity;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
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

    @Builder(access = AccessLevel.PRIVATE)
    private Parent(String email, String password, String name) {
        super(email, password, name, UserRole.PARENT);
    }

    public static Parent createParent(String email, String password, String name) {
        return Parent.builder()
            .email(email)
            .password(password)
            .name(name)
            .build();
    }
}
