package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.user.domain.entity.Children;
import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenParentRelation;
import com.ssafy.rebloom.auth_service.user.domain.entity.Counselor;
import com.ssafy.rebloom.auth_service.user.domain.entity.Parent;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserProfileResponseDto;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenParentRelationRepository;
import com.ssafy.rebloom.auth_service.user.repository.ParentRepository;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.RedisService;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.ListResponseDto;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final ChildrenParentRelationRepository childrenParentRelationRepository;
    private final RedisService redisService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public boolean isAlreadyExistsEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional
    public void signupUser(UserCreateRequestDto userCreateRequestDto) {
        if (userRepository.existsByEmail(userCreateRequestDto.email())) {
            throw new CustomException("이미 사용 중인 이메일입니다.", ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String registerUUID = userCreateRequestDto.registerUUID();
        boolean isSocialSignup = StringUtils.hasText(registerUUID);

        if (!isSocialSignup) {
            validateEmailVerification(userCreateRequestDto.email());
        }

        String encryptedPassword = passwordEncoder.encode(userCreateRequestDto.password());

        switch (userCreateRequestDto.role()) {
            case PARENT -> {
                Parent parent = Parent.createParent(
                    userCreateRequestDto.email(),
                    encryptedPassword,
                    userCreateRequestDto.name(),
                    userCreateRequestDto.phone()
                );
                userRepository.save(parent);
            }
            case CHILDREN -> {
                Parent parent = parentRepository.findByCode(userCreateRequestDto.parentCode())
                    .orElseThrow(() -> new CustomException("유효하지 않은 부모 코드입니다.", ErrorCode.INVALID_PARENT_CODE));

                Children child = Children.createChildren(
                    userCreateRequestDto.email(),
                    encryptedPassword,
                    userCreateRequestDto.name(),
                    userCreateRequestDto.phone(),
                    userCreateRequestDto.birth(),
                    userCreateRequestDto.gender(),
                    userCreateRequestDto.address(),
                    userCreateRequestDto.addressDetail()
                );
                userRepository.save(child);

                ChildrenParentRelation relation = ChildrenParentRelation.builder()
                    .children(child)
                    .parent(parent)
                    .relationStatus(RelationStatus.PENDING)
                    .build();
                childrenParentRelationRepository.save(relation);
            }
            case COUNSELOR -> {
                Counselor counselor = Counselor.createCounselor(
                    userCreateRequestDto.email(),
                    encryptedPassword,
                    userCreateRequestDto.name(),
                    userCreateRequestDto.phone(),
                    userCreateRequestDto.hospitalName(),
                    userCreateRequestDto.hospitalAddress(),
                    userCreateRequestDto.hospitalAddressDetail()
                );
                userRepository.save(counselor);
            }
        }

        if (!isSocialSignup) {
            deleteVerificationData(userCreateRequestDto.email());
        }
    }

    @Override
    @Transactional
    public void withDrawUser(UUID userId) {
        User user = getUser(userId);
        user.withDrawUser();
    }

    @Override
    public UserInfoResponseDto getMyInfo(UUID userId) {
        User user = getUser(userId);
        return toUserInfoResponse(user);
    }

    @Override
    @Transactional
    public UserInfoResponseDto updateMyInfo(UUID userId, UserUpdateRequestDto request) {
        User user = getUser(userId);
        validateUpdateRequest(request);

        String email = resolveUpdateValue(request.email(), user.getEmail());
        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new CustomException("이미 사용 중인 이메일입니다.", ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        return switch (user.getRole()) {
            case COUNSELOR -> {
                Counselor counselor = (Counselor) user;
                counselor.updateCounselorProfile(
                    email,
                    resolveUpdateValue(request.name(), counselor.getName()),
                    resolveUpdateValue(request.phone(), counselor.getPhone()),
                    resolveUpdateValue(request.hospitalName(), counselor.getHospitalName()),
                    resolveUpdateValue(request.hospitalAddress(), counselor.getHospitalAddress())
                );
                yield toUserInfoResponse(counselor);
            }
            case PARENT, CHILDREN -> throw new CustomException(
                "해당 역할은 프로필 수정을 지원하지 않습니다.",
                ErrorCode.FORBIDDEN
            );
        };
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, PasswordChangeRequestDto request) {
        User user = getUser(userId);

        if (user.getRole() == UserRole.COUNSELOR) {
            validateCounselorPasswordChange(user, request);
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new CustomException("새 비밀번호는 현재 비밀번호와 달라야 합니다.", ErrorCode.INVALID_PARAMETER);
        }

        user.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Override
    public void verifyPassword(UUID userId, String password) {
        User user = getUser(userId);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new CustomException("현재 비밀번호가 일치하지 않습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    @Override
    public ListResponseDto<UserProfileResponseDto> searchProfiles(String email, String name,
        UserRole userRole) {

        List<User> profiles = userRepository.findAllByEmailAndNameAndRole(email, name, userRole);
        return ListResponseDto.from(profiles.stream().map(UserProfileResponseDto::from).toList());
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(
            () -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND)
        );
    }

    private void validateUpdateRequest(UserUpdateRequestDto request) {
        validateNotBlankIfPresent(request.email(), "email");
        validateNotBlankIfPresent(request.name(), "name");
        validateNotBlankIfPresent(request.phone(), "phone");
        validateNotBlankIfPresent(request.hospitalName(), "hospitalName");
        validateNotBlankIfPresent(request.hospitalAddress(), "hospitalAddress");
    }

    private void validateNotBlankIfPresent(String value, String fieldName) {
        if (value != null && !StringUtils.hasText(value)) {
            throw new CustomException(fieldName + "은(는) 공백일 수 없습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private String resolveUpdateValue(String requestValue, String currentValue) {
        return requestValue == null ? currentValue : requestValue;
    }

    private void validateCounselorPasswordChange(User user, PasswordChangeRequestDto request) {
        if (!StringUtils.hasText(request.currentPassword())) {
            throw new CustomException("현재 비밀번호는 필수입니다.", ErrorCode.INVALID_PARAMETER);
        }

        if (!StringUtils.hasText(request.newPasswordConfirm())) {
            throw new CustomException("새 비밀번호 확인은 필수입니다.", ErrorCode.INVALID_PARAMETER);
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new CustomException("현재 비밀번호가 일치하지 않습니다.", ErrorCode.INVALID_PARAMETER);
        }

        if (!request.newPassword().equals(request.newPasswordConfirm())) {
            throw new CustomException("새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private UserInfoResponseDto toUserInfoResponse(User user) {
        return switch (user.getRole()) {
            case PARENT -> {
                Parent parent = (Parent) user;
                yield UserInfoResponseDto.builder()
                    .userId(parent.getId())
                    .email(parent.getEmail())
                    .name(parent.getName())
                    .phone(parent.getPhone())
                    .role(parent.getRole())
                    .status(parent.getStatus())
                    .parentCode(parent.getCode())
                    .build();
            }
            case CHILDREN -> {
                Children children = (Children) user;
                yield UserInfoResponseDto.builder()
                    .userId(children.getId())
                    .email(children.getEmail())
                    .name(children.getName())
                    .phone(children.getPhone())
                    .role(children.getRole())
                    .status(children.getStatus())
                    .birth(children.getBirth())
                    .gender(children.getGender())
                    .address(children.getAddress())
                    .addressDetail(children.getAddressDetail())
                    .build();
            }
            case COUNSELOR -> {
                Counselor counselor = (Counselor) user;
                yield UserInfoResponseDto.builder()
                    .userId(counselor.getId())
                    .email(counselor.getEmail())
                    .name(counselor.getName())
                    .phone(counselor.getPhone())
                    .role(counselor.getRole())
                    .status(counselor.getStatus())
                    .hospitalName(counselor.getHospitalName())
                    .hospitalAddress(counselor.getHospitalAddress())
                    .build();
            }
        };
    }

    private void validateEmailVerification(String email) {
        String isVerified = redisService.getData(Constants.VERIFIED_EMAIL_PREFIX + email);

        if (!"true".equals(isVerified)) {
            throw new CustomException("이메일 인증이 필요합니다.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private void deleteVerificationData(String email) {
        redisService.deleteData(Constants.VERIFIED_EMAIL_PREFIX + email);
    }
}
