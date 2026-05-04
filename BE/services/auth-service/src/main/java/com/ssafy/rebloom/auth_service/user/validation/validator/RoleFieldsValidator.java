package com.ssafy.rebloom.auth_service.user.validation.validator;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.validation.ValidRoleFields;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class RoleFieldsValidator implements ConstraintValidator<ValidRoleFields, UserCreateRequestDto> {

    @Override
    public boolean isValid(UserCreateRequestDto dto, ConstraintValidatorContext context) {
        if (dto.role() == null) return true;

        boolean isValid = true;
        context.disableDefaultConstraintViolation();

        if (dto.role() == UserRole.CHILDREN) {
            if (isEmpty(dto.parentCode()) || isEmpty(dto.birth()) || dto.gender() == null) {
                addError(context, "자녀 가입 시 부모 코드, 생년월일, 성별은 필수입니다.");
                isValid = false;
            }

        }
        else if (dto.role() == UserRole.COUNSELOR) {
            if (isEmpty(dto.hospitalName()) || isEmpty(dto.hospitalAddress())) {
                addError(context, "상담사 가입 시 병원 이름과 주소는 필수입니다.");
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