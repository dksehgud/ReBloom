package com.ssafy.rebloom.auth_service.user.service.impl;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.user.domain.entity.Children;
import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenParentRelation;
import com.ssafy.rebloom.auth_service.user.domain.entity.Counselor;
import com.ssafy.rebloom.auth_service.user.domain.entity.Parent;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.dto.request.UserCreateRequestDto;
import com.ssafy.rebloom.auth_service.user.repository.ChildrenParentRelationRepository;
import com.ssafy.rebloom.auth_service.user.repository.ParentRepository;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
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

