package com.ssafy.rebloom.auth_service.user.dto.request;

import jakarta.validation.constraints.Email;
import java.math.BigDecimal;

public record UserUpdateRequestDto(

    String name,

    @Email
    String email,

    String phone,

    String hospitalName,

    String hospitalAddress,

    String hospitalAddressDetail,

    String address,

    String addressDetail,

    BigDecimal latitude,

    BigDecimal longitude
) {
}
