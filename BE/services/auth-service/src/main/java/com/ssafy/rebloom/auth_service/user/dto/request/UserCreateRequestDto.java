package com.ssafy.rebloom.auth_service.user.dto.request;

import com.ssafy.rebloom.auth_service.user.domain.enums.Gender;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.validation.ValidRoleFields;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@ValidRoleFields
public record UserCreateRequestDto (

    @NotBlank @Email
    String email,

    String password,

    @NotBlank
    String name,

    @NotNull
    UserRole role,

    // SocialUser
    String registerUUID,

    // CHILDREN
    @Email
    String parentEmail,
    String birth,
    Gender gender,
    String address,
    String addressDetail,
    BigDecimal latitude,
    BigDecimal longitude,

    // COUNSELOR
    String phone,
    String hospitalName,
    String hospitalAddress,
    String hospitalAddressDetail

    ){

}
