package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.user.domain.entity.*;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.dto.query.ParentReceiverDto;
import com.ssafy.rebloom.auth_service.user.dto.request.PasswordChangeRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.ParentConnectRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.request.UserUpdateRequestDto;
import com.ssafy.rebloom.auth_service.user.dto.response.*;
import com.ssafy.rebloom.auth_service.user.repository.*;
import com.ssafy.rebloom.auth_service.user.service.RedisService;
import com.ssafy.rebloom.auth_service.user.service.UserService;
import com.ssafy.rebloom.common.dto.ListResponseDto;
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
                    userCreateRequestDto.name()
                );
                userRepository.save(parent);
            }
            case CHILDREN -> {
                Parent parent = parentRepository.findByEmail(userCreateRequestDto.parentEmail())
                    .orElseThrow(() -> new CustomException("부모를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

                Children child = Children.createChildren(
                    userCreateRequestDto.email(),
                    encryptedPassword,
                    userCreateRequestDto.name(),
                    userCreateRequestDto.birth(),
                    userCreateRequestDto.gender(),
                    userCreateRequestDto.address(),
                    userCreateRequestDto.addressDetail(),
                    userCreateRequestDto.latitude(),
                    userCreateRequestDto.longitude()
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
            case CHILDREN -> {
                Children children = (Children) user;
                validateChildrenLocationUpdate(request);
                children.updateAddress(
                    resolveUpdateValue(request.address(), children.getAddress()),
                    resolveUpdateValue(request.addressDetail(), children.getAddressDetail()),
                    request.latitude() == null ? children.getLatitude() : request.latitude(),
                    request.longitude() == null ? children.getLongitude() : request.longitude()
                );
                yield toUserInfoResponse(children);
            }
            case PARENT -> throw new CustomException(
                "해당 역할은 프로필 수정을 지원하지 않습니다.",
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
        return toParentSummaryResponse(getParentByEmailOrThrow(email));
    }

    @Override
    @Transactional
    public ParentSummaryResponseDto connectParent(UUID childrenId, ParentConnectRequestDto request) {
        Children children = getChildren(childrenId);
        Parent parent = getParentByEmailOrThrow(request.email());

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
    public ListResponseDto<UserProfileResponseDto> searchProfiles(String email, UserRole userRole) {

        List<User> profiles = userRepository.findAllByEmailAndRole(email, userRole);
        return ListResponseDto.from(profiles.stream().map(UserProfileResponseDto::from).toList());
    }

    @Override
    public ParentReceiverResponseDto getParentReceiverByChildrenId(UUID childrenId) {
        return parentRepository.findParentReceiverByChildrenId(childrenId)
            .map(this::toParentReceiverResponse)
            .orElseGet(() -> ParentReceiverResponseDto.disconnected(childrenId));
    }

    private ParentReceiverResponseDto toParentReceiverResponse(ParentReceiverDto parentReceiverDto) {
        return new ParentReceiverResponseDto(
            true,
            parentReceiverDto.parentId(),
            parentReceiverDto.childrenId(),
            parentReceiverDto.childrenName()
        );
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(
            () -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND)
        );
    }

    private Parent getParentByEmailOrThrow(String email) {
        return parentRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("부모를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));
    }

    private Children getChildren(UUID childrenId) {
        User user = getUser(childrenId);
        if (!(user instanceof Children children)) {
            throw new CustomException("아이 사용자가 아닙니다.", ErrorCode.INVALID_PARAMETER);
        }

        return children;
    }

    private void validateUpdateRequest(UserUpdateRequestDto request) {
        validateNotBlankIfPresent(request.email(), "email");
        validateNotBlankIfPresent(request.name(), "name");
        validateNotBlankIfPresent(request.phone(), "phone");
        validateNotBlankIfPresent(request.hospitalName(), "hospitalName");
        validateNotBlankIfPresent(request.hospitalAddress(), "hospitalAddress");
        validateNotBlankIfPresent(request.address(), "address");
        validateNotBlankIfPresent(request.addressDetail(), "addressDetail");
    }

    private void validateChildrenLocationUpdate(UserUpdateRequestDto request) {
        boolean addressChanged = request.address() != null || request.addressDetail() != null;
        boolean locationChanged = request.latitude() != null || request.longitude() != null;

        if ((addressChanged || locationChanged) && (request.latitude() == null || request.longitude() == null)) {
            throw new CustomException("주소 변경 시 위도와 경도는 함께 전달해야 합니다.", ErrorCode.INVALID_PARAMETER);
        }
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
                    .role(children.getRole())
                    .status(children.getStatus())
                    .birth(children.getBirth())
                    .gender(children.getGender())
                    .address(children.getAddress())
                    .addressDetail(children.getAddressDetail())
                    .latitude(children.getLatitude())
                    .longitude(children.getLongitude())
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
