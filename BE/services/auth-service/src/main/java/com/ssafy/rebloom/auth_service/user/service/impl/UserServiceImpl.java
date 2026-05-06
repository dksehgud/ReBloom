package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.user.domain.entity.Children;
import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenParentRelation;
import com.ssafy.rebloom.auth_service.user.domain.entity.Counselor;
import com.ssafy.rebloom.auth_service.user.domain.entity.Parent;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.UserInfoResponseDto;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenParentRelationRepository;
import com.ssafy.rebloom.auth_service.user.repository.ParentRepository;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.RedisService;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
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
            throw new CustomException("이미 가입된 이메일입니다.", ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String registerUUID = userCreateRequestDto.registerUUID();
        boolean isSocialSignup = StringUtils.hasText(registerUUID);

        if (!isSocialSignup) {
//            validateEmailVerification(userCreateRequestDto.email());
        }

        String encryptedPassword = passwordEncoder.encode(userCreateRequestDto.password());

        User savedUser = null;

        switch (userCreateRequestDto.role()) {
            case PARENT -> {
                Parent parent = Parent.createParent(
                    userCreateRequestDto.email(),
                    encryptedPassword,
                    userCreateRequestDto.name(),
                    userCreateRequestDto.phone()
                );
                savedUser = userRepository.save(parent);
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
                savedUser = userRepository.save(child);

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
                    userCreateRequestDto.hospitalAddress()
                );
                savedUser = userRepository.save(counselor);
            }
        }

//        if (isSocialSignup && savedUser != null) {
//            linkSocialUser(registerUUID, savedUser, userCreateRequestDto.email());
//        }

        if (!isSocialSignup) {
            deleteVerificationData(userCreateRequestDto.email());
        }
    }

    @Override
    public void withDrawUser(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(
            () -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND)
        );

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
            throw new CustomException("Email already exists.", ErrorCode.EMAIL_ALREADY_EXISTS);
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
                "Profile update is not supported for this role.",
                ErrorCode.FORBIDDEN
            );
        };
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, String newPassword) {
        User user = getUser(userId);
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new CustomException("New password must be different from current password.", ErrorCode.INVALID_PARAMETER);
        }

        user.changePassword(passwordEncoder.encode(newPassword));
    }

    @Override
    public void verifyPassword(UUID userId, String password) {
        User user = getUser(userId);
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new CustomException("Password does not match.", ErrorCode.LOGIN_FAILED);
        }
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(
            () -> new CustomException("User not found.", ErrorCode.USER_NOT_FOUND)
        );
    }

    private UserInfoResponseDto toUserInfoResponse(User user) {
        UserInfoResponseDto.UserInfoResponseDtoBuilder builder = UserInfoResponseDto.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .phone(user.getPhone())
            .role(user.getRole())
            .status(user.getStatus());

        return switch (user.getRole()) {
            case PARENT -> {
                Parent parent = (Parent) user;
                yield builder
                    .parentCode(parent.getCode())
                    .build();
            }
            case CHILDREN -> {
                Children children = (Children) user;
                yield builder
                    .birth(children.getBirth())
                    .gender(children.getGender())
                    .address(children.getAddress())
                    .addressDetail(children.getAddressDetail())
                    .build();
            }
            case COUNSELOR -> {
                Counselor counselor = (Counselor) user;
                yield builder
                    .hospitalName(counselor.getHospitalName())
                    .hospitalAddress(counselor.getHospitalAddress())
                    .build();
            }
        };
    }

    private void validateUpdateRequest(UserUpdateRequestDto request) {
        validateNotBlankIfPresent(request.name(), "name");
        validateNotBlankIfPresent(request.email(), "email");
        validateNotBlankIfPresent(request.phone(), "phone");
        validateNotBlankIfPresent(request.hospitalName(), "hospitalName");
        validateNotBlankIfPresent(request.hospitalAddress(), "hospitalAddress");
    }

    private void validateNotBlankIfPresent(String value, String fieldName) {
        if (value != null && !StringUtils.hasText(value)) {
            throw new CustomException(fieldName + " must not be blank.", ErrorCode.INVALID_PARAMETER);
        }
    }

    private String resolveUpdateValue(String requestedValue, String currentValue) {
        return requestedValue != null ? requestedValue : currentValue;
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

//    private void linkSocialUser(String registerUUID, User savedUser, String requestEmail) {
//        SocialUserInfoDto socialUserInfo = oAuthService.getTempSocialUserFromRedis(registerUUID);
//
//        if (!socialUserInfo.email().equals(requestEmail)) {
//            throw new CustomException("비정상적인 회원가입 시도입니다.", ErrorCode.BAD_REQUEST);
//        }
//
//        SocialUser socialUser = SocialUser.create(
//            socialUserInfo.provider(),
//            socialUserInfo.providerId(),
//            savedUser
//        );
//        socialUserRepository.save(socialUser);
//
//        oAuthService.deleteTempSocialUser(registerUUID);
//    }
}

