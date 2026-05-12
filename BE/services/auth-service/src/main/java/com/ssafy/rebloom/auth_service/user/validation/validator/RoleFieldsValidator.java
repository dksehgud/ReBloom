package com.ssafy.rebloom.auth_service.user.validation.validator;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.validation.ValidRoleFields;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class RoleFieldsValidator implements ConstraintValidator<ValidRoleFields, UserCreateRequestDto> {

    @Override
    public boolean isValid(UserCreateRequestDto dto, ConstraintValidatorContext context) {
        if (dto.role() == null) {
            return true;
        }

        boolean isValid = true;
        context.disableDefaultConstraintViolation();

        if (dto.role() == UserRole.CHILDREN) {
            if (isEmpty(dto.parentEmail())
                || isEmpty(dto.birth())
                || dto.gender() == null
                || isEmpty(dto.address())
                || isEmpty(dto.addressDetail())
                || dto.latitude() == null
                || dto.longitude() == null) {
                addError(context, "아이 가입에는 부모 이메일, 생년월일, 성별, 주소, 상세주소, 위도, 경도가 필수입니다.");
                isValid = false;
            }
        } else if (dto.role() == UserRole.COUNSELOR) {
            if (isEmpty(dto.hospitalName())
                || isEmpty(dto.hospitalAddress())
                || isEmpty(dto.hospitalAddressDetail())
                || isEmpty(dto.phone())) {
                addError(context, "상담사 가입에는 병원 이름, 주소, 상세주소, 전화번호가 필수입니다.");
                isValid = false;
            }
        }

        return isValid;
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void addError(ConstraintValidatorContext context, String message) {
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}
