package com.ssafy.rebloom.auth_service.auth.security;

import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Spring Security 기본 메서드
    @Override
    public CustomUserDetails loadUserByUsername(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

        return CustomUserDetails.of(user);
    }

    public CustomUserDetails loadUserById(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

        return CustomUserDetails.of(user);
    }
}