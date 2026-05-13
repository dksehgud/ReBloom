package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.user.domain.entity.Children;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildAgeResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.ChildGpsResponseDto;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.InternalUserService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InternalUserServiceImpl implements InternalUserService {

    private static final DateTimeFormatter BIRTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final UserRepository userRepository;

    @Override
    public ChildGpsResponseDto getChildGpsInfo(UUID childId) {
        Children children = getChildren(childId);

        return new ChildGpsResponseDto(
            children.getId(),
            children.getLatitude() == null ? null : children.getLatitude().setScale(10, java.math.RoundingMode.HALF_UP),
            children.getLongitude() == null ? null : children.getLongitude().setScale(10, java.math.RoundingMode.HALF_UP)
        );
    }

    @Override
    public ChildAgeResponseDto getChildAge(UUID childId) {
        Children children = getChildren(childId);
        LocalDate birth = LocalDate.parse(children.getBirth(), BIRTH_FORMATTER);
        return new ChildAgeResponseDto(Period.between(birth, LocalDate.now()).getYears());
    }

    private Children getChildren(UUID childId) {
        User user = userRepository.findById(childId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Children children)) {
            throw new CustomException("아동 사용자가 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }

        return children;
    }
}
