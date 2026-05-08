package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.user.domain.entity.*;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.dto.request.ParentConnectRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.*;
import com.ssafy.rebloom.auth_service.user.repository.*;
import com.ssafy.rebloom.auth_service.user.service.RedisService;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final ChildrenParentRelationRepository childrenParentRelationRepository;
    private final ChildrenCounselorRelationRepository childrenCounselorRelationRepository;
    private final ParentCounselorRelationRepository parentCounselorRelationRepository;

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
            validateEmailVerification(userCreateRequestDto.email());
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
    public CounselorChildrenResponseDto getCounselorChildren(UUID counselorId) {
        List<CounselorChildResponseDto> childrenList = childrenCounselorRelationRepository
            .findChildrenByCounselorId(counselorId)
            .stream()
            .map(this::toCounselorChildResponse)
            .toList();

        return new CounselorChildrenResponseDto(childrenList);
    }

    @Override
    public ParentCounselorResponseDto getParentCounselor(UUID parentId) {
        return parentCounselorRelationRepository.findByParentId(parentId)
            .orElseGet(ParentCounselorResponseDto::disconnected);
    }

    @Override
    public ParentConnectedChildResponseDto getConnectedChildByParent(UUID parentId) {
        return childrenParentRelationRepository.findActiveChildByParentId(parentId)
            .map(this::toParentConnectedChildResponse)
            .orElseGet(ParentConnectedChildResponseDto::disconnected);
    }

    @Override
    public ChildConnectedParentResponseDto getConnectedParentByChild(UUID childrenId) {
        return childrenParentRelationRepository.findActiveParentByChildrenId(childrenId)
            .map(this::toChildConnectedParentResponse)
            .orElseGet(ChildConnectedParentResponseDto::disconnected);
    }

    @Override
    public ParentSummaryResponseDto getParentByEmail(String email) {
        Parent parent = parentRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("부모를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

        return toParentSummaryResponse(parent);
    }

    @Override
    @Transactional
    public ParentSummaryResponseDto connectParent(UUID childrenId, ParentConnectRequestDto request) {
        Children children = getChildren(childrenId);
        Parent parent = parentRepository.findByEmail(request.email())
            .orElseThrow(() -> new CustomException("부모를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

        if (!parent.getName().equals(request.name())) {
            throw new CustomException("부모 정보가 일치하지 않습니다.", ErrorCode.INVALID_PARAMETER);
        }

        if (!childrenParentRelationRepository.existsRelation(parent.getId(), children.getId())) {
            ChildrenParentRelation relation = ChildrenParentRelation.builder()
                .children(children)
                .parent(parent)
                .relationStatus(RelationStatus.ACTIVE)
                .build();
            childrenParentRelationRepository.save(relation);
        }

        return toParentSummaryResponse(parent);
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

    private Children getChildren(UUID childrenId) {
        User user = getUser(childrenId);
        if (!(user instanceof Children children)) {
            throw new CustomException("아이 사용자가 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }

        return children;
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

    private CounselorChildResponseDto toCounselorChildResponse(CounselorChildProjection projection) {
        return new CounselorChildResponseDto(
            projection.getChildrenId(),
            projection.getName(),
            projection.getCounselingStatus()
        );
    }

    private ParentConnectedChildResponseDto toParentConnectedChildResponse(ParentConnectedChildProjection projection) {
        return new ParentConnectedChildResponseDto(
            true,
            projection.getChildrenId(),
            projection.getName(),
            projection.getEmail(),
            calculateAge(projection.getBirth())
        );
    }

    private ChildConnectedParentResponseDto toChildConnectedParentResponse(ChildConnectedParentProjection projection) {
        return new ChildConnectedParentResponseDto(
            true,
            projection.getParentId(),
            projection.getName(),
            projection.getEmail()
        );
    }

    private ParentSummaryResponseDto toParentSummaryResponse(Parent parent) {
        return new ParentSummaryResponseDto(
            parent.getId(),
            parent.getName(),
            parent.getEmail()
        );
    }

    private Integer calculateAge(String birth) {
        LocalDate birthDate = parseBirthDate(birth);
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private LocalDate parseBirthDate(String birth) {
        List<DateTimeFormatter> formatters = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("yyyyMMdd"),
            DateTimeFormatter.ofPattern("yyyy.MM.dd")
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(birth, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        throw new CustomException("아이 생년월일 형식이 올바르지 않습니다.", ErrorCode.INVALID_PARAMETER);
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

