package com.ssafy.rebloom.auth_service.user.validation.validator;

import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.validation.ValidRoleFields;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.List;

public class RoleFieldsValidator implements ConstraintValidator<ValidRoleFields, UserCreateRequestDto> {

    private static final String PHONE_NUMBER_PATTERN = "^010-\\d{4}-\\d{4}$";

    private static final List<DateTimeFormatter> BIRTH_FORMATTERS = List.of(
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("uuuuMMdd").withResolverStyle(ResolverStyle.STRICT),
        DateTimeFormatter.ofPattern("uuuu.MM.dd").withResolverStyle(ResolverStyle.STRICT)
    );

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

            if (!isEmpty(dto.birth()) && !isValidBirth(dto.birth())) {
                addError(context, "아이 생년월일은 실제 존재하는 날짜여야 합니다. 허용 형식: yyyy-MM-dd, yyyyMMdd, yyyy.MM.dd.");
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

        if (dto.role() == UserRole.COUNSELOR && !isEmpty(dto.phone()) && !isValidPhone(dto.phone())) {
            addError(context, "전화번호는 010-1234-5678 형식이어야 합니다.");
            isValid = false;
        }

        return isValid;
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean isValidBirth(String birth) {
        String normalizedBirth = birth.trim();

        for (DateTimeFormatter formatter : BIRTH_FORMATTERS) {
            try {
                LocalDate birthDate = LocalDate.parse(normalizedBirth, formatter);
                return !birthDate.isAfter(LocalDate.now());
            } catch (DateTimeParseException ignored) {
            }
        }

        return false;
    }

    private boolean isValidPhone(String phone) {
        return phone.trim().matches(PHONE_NUMBER_PATTERN);
    }

    private void addError(ConstraintValidatorContext context, String message) {
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}
