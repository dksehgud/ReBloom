package com.ssafy.rebloom.security.filter;

import com.ssafy.rebloom.security.dto.AuthUserInfo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
public class HeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String userIdString = request.getHeader("x-user-id");
        String role = request.getHeader("x-user-role");

        if (userIdString != null && role != null) {
            try {
                UUID userId = UUID.fromString(userIdString);

                String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));

                // Principal 자리에 AuthUserInfo
                AuthUserInfo authUserInfo = new AuthUserInfo(userId, role);

                // 인증 객체 SecurityContext에 저장
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(authUserInfo, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (IllegalArgumentException e) {
                log.warn("유효하지 않은 UUID 형식의 헤더 접근 - userId: {}", userIdString);
                sendErrorResponse(response, "유효하지 않은 사용자 ID 형식입니다.");
                return;
            }
        } else if (userIdString != null || role != null) {
            log.warn("비정상적인 인증 헤더 감지 - userId: {}, role: {}", userIdString, role);
            sendErrorResponse(response, "인증 헤더 정보가 불완전합니다.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        String errorMessage = String.format("{\"errorCode\": \"UNAUTHORIZED\", \"message\": \"%s\"}", message);

        response.getWriter().write(errorMessage);
    }
}