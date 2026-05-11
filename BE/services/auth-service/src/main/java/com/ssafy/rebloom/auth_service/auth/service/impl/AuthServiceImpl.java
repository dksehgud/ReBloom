package com.ssafy.rebloom.auth_service.auth.service.impl;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.dto.request.LoginRequestDto;
import com.ssafy.rebloom.auth_service.auth.security.CustomUserDetails;
import com.ssafy.rebloom.auth_service.auth.service.AuthService;
import com.ssafy.rebloom.auth_service.auth.service.RefreshTokenService;
import com.ssafy.rebloom.auth_service.auth.util.JwtUtil;
import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserStatus;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import com.ssafy.rebloom.auth_service.user.service.RedisService;
import com.ssafy.rebloom.common.exception.CustomException;
import com.ssafy.rebloom.common.exception.ErrorCode;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final RefreshTokenService refreshTokenService;
    private final RedisService redisService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL_CHARACTERS = "!@#$%^&*";
    private static final String PASSWORD_CHARACTERS = LOWERCASE + UPPERCASE + DIGITS + SPECIAL_CHARACTERS;
    private static final int TEMPORARY_PASSWORD_LENGTH = 12;

    @Override
    public TokenDto login(LoginRequestDto loginRequestDto) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequestDto.email(),
                    loginRequestDto.password()
                )
            );

            UUID userId = extractUserId(authentication);
            UserRole userRole = extracntUserRole(authentication);
            log.info("userId = {}", userId);
            String accessToken = jwtUtil.createAccessToken(userId, userRole);
            String refreshToken = jwtUtil.createRefreshToken(userId);

            refreshTokenService.save(
                userId,
                refreshToken,
                getRefreshTokenMaxAgeSeconds()
            );

            return TokenDto.from(accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            throw new CustomException("이메일 또는 비밀번호가 올바르지 않습니다.", ErrorCode.LOGIN_FAILED);
        } catch (DisabledException e) {
            throw new CustomException("탈퇴한 사용자입니다.", ErrorCode.USER_WITHDRAW);
        } catch (AuthenticationException e) {
            throw new CustomException("인증에 실패했습니다.", ErrorCode.LOGIN_FAILED);
        }
    }

    @Override
    public void logout(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return;
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            return;
        }

        UUID userId = jwtUtil.getUserId(refreshToken);
        refreshTokenService.delete(userId);
    }

    @Override
    public void revokeTokens(UUID userId) {
        refreshTokenService.delete(userId);
    }

    @Override
    public TokenDto reissue(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            throw new CustomException("리프레시 토큰이 없습니다.", ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            throw new CustomException("리프레시 토큰이 만료되었습니다. 재로그인 필요", ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        UUID userId = jwtUtil.getUserId(refreshToken);
        if (!refreshTokenService.matches(userId, refreshToken)) {
            refreshTokenService.delete(userId);
            throw new CustomException("리프레시 토큰이 일치하지 않습니다.", ErrorCode.INVALID_REFRESH_TOKEN);
        }

        User user = userRepository.findById(userId).
            orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND.getMessage(),
                ErrorCode.USER_NOT_FOUND));

        String newAccessToken = jwtUtil.createAccessToken(userId, user.getRole());
        String newRefreshToken = jwtUtil.createRefreshToken(userId);

        refreshTokenService.save(
            userId,
            newRefreshToken,
            getRefreshTokenMaxAgeSeconds()
        );

        return TokenDto.from(newAccessToken, newRefreshToken);
    }

    @Override
    public long getRefreshTokenMaxAgeSeconds() {
        return jwtUtil.getRefreshTokenExpireTimeMillis() / 1000;
    }

    @Override
    public void sendVerificationEmail(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getStatus() == UserStatus.WITHDRAW) {
                throw new CustomException("탈퇴한 사용자입니다. 관리자에게 문의해주세요.", ErrorCode.USER_WITHDRAW);
            }
            throw new CustomException("이미 존재하는 이메일입니다.", ErrorCode.EMAIL_ALREADY_EXISTS);
        });

        // 난수 생성
        String code = String.format("%06d", secureRandom.nextInt(1000000));
        log.info("code = {}", code);
        // Redis 저장(5분)
        redisService.setDataWithExpire(
            Constants.VERIFY_CODE_PREFIX + email,
            code,
            5,
            TimeUnit.MINUTES
        );

        // 이메일 발송
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("[Re:Bloom] 회원가입 인증 번호입니다.");
            helper.setText("인증 번호: <b>" + code + "</b>", true);
            mailSender.send(message);
        } catch (Exception e) {
            redisService.deleteData(Constants.VERIFY_CODE_PREFIX + email);
            throw new CustomException("메일 발송 실패", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public boolean verifyEmailCode(String email, String code) {
        String savedCode = redisService.getData(Constants.VERIFY_CODE_PREFIX + email);

        if (savedCode != null && savedCode.equals(code)) {
            redisService.setDataWithExpire(
                Constants.VERIFIED_EMAIL_PREFIX + email,
                "true",
                10,
                TimeUnit.MINUTES
            );
            redisService.deleteData(Constants.VERIFY_CODE_PREFIX + email);
            return true;
        }

        return false;
    }

    @Override
    @Transactional
    public void resetPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.WITHDRAW) {
            throw new CustomException("탈퇴한 사용자입니다.", ErrorCode.USER_WITHDRAW);
        }

        String temporaryPassword = generateTemporaryPassword();

        user.changePassword(passwordEncoder.encode(temporaryPassword));
        refreshTokenService.delete(user.getId());
        sendTemporaryPasswordEmail(email, temporaryPassword);
    }

    private String generateTemporaryPassword() {
        List<Character> characters = new ArrayList<>();
        characters.add(randomCharacter(LOWERCASE));
        characters.add(randomCharacter(UPPERCASE));
        characters.add(randomCharacter(DIGITS));
        characters.add(randomCharacter(SPECIAL_CHARACTERS));

        for (int i = characters.size(); i < TEMPORARY_PASSWORD_LENGTH; i++) {
            characters.add(randomCharacter(PASSWORD_CHARACTERS));
        }

        Collections.shuffle(characters, secureRandom);

        StringBuilder temporaryPassword = new StringBuilder(TEMPORARY_PASSWORD_LENGTH);
        for (Character character : characters) {
            temporaryPassword.append(character);
        }

        return temporaryPassword.toString();
    }

    private Character randomCharacter(String source) {
        return source.charAt(secureRandom.nextInt(source.length()));
    }

    private void sendTemporaryPasswordEmail(String email, String temporaryPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("[Re:Bloom] 임시 비밀번호 안내");
            helper.setText("""
                <p>안녕하세요. Re:Bloom 임시 비밀번호가 발급되었습니다.</p>
                <p>임시 비밀번호: <b>%s</b></p>
                <p>로그인 후 비밀번호를 변경해 주세요.</p>
                """.formatted(temporaryPassword), true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new CustomException("임시 비밀번호 메일 발송에 실패했습니다.", ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }


    private UUID extractUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }
        throw new CustomException("인증 정보 추출 실패", ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private UserRole extracntUserRole(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getRole();
        }
        throw new CustomException("인증 정보 추출 실패", ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
