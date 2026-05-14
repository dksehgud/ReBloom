package com.ssafy.rebloom.auth_service.auth.security;

import com.ssafy.rebloom.auth_service.auth.dto.OAuth2LoginResult;
import com.ssafy.rebloom.auth_service.auth.dto.TokenDto;
import com.ssafy.rebloom.auth_service.auth.service.OAuth2LoginService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final String GOOGLE_PROVIDER = "google";
    private static final String KAKAO_PROVIDER = "kakao";

    private final OAuth2LoginService oAuth2LoginService;

    @Value("${oauth2.success-redirect-url:http://localhost:5173/oauth/callback}")
    private String successRedirectUrl;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauthUser = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId();

        OAuth2UserProfile profile = extractProfile(provider, oauthUser);
        OAuth2LoginResult result = oAuth2LoginService.loginOrRegister(
            provider,
            profile.providerUserId(),
            profile.email(),
            profile.name()
        );

        response.sendRedirect(createRedirectUrl(result));
    }

    private String createRedirectUrl(OAuth2LoginResult result) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(successRedirectUrl);

        if (result.registered()) {
            TokenDto tokenDto = result.tokenDto();
            return builder
                .queryParam("status", "LOGIN")
                .queryParam("accessToken", tokenDto.accessToken())
                .queryParam("refreshToken", tokenDto.refreshToken())
                .build()
                .encode()
                .toUriString();
        }

        return builder
            .queryParam("status", "SIGNUP_REQUIRED")
            .queryParam("registerUUID", result.registerUUID())
            .queryParam("provider", result.provider())
            .queryParam("email", result.email())
            .build()
            .encode()
            .toUriString();
    }

    private OAuth2UserProfile extractProfile(String provider, OAuth2User oauthUser) {
        if (GOOGLE_PROVIDER.equals(provider)) {
            return new OAuth2UserProfile(
                oauthUser.getAttribute("sub"),
                oauthUser.getAttribute("email"),
                oauthUser.getAttribute("name")
            );
        }

        if (KAKAO_PROVIDER.equals(provider)) {
            Map<String, Object> kakaoAccount = oauthUser.getAttribute("kakao_account");
            Map<String, Object> profile = kakaoAccount == null ? null : castMap(kakaoAccount.get("profile"));
            Object providerUserId = oauthUser.getAttribute("id");

            return new OAuth2UserProfile(
                String.valueOf(providerUserId),
                kakaoAccount == null ? null : (String) kakaoAccount.get("email"),
                profile == null ? null : (String) profile.get("nickname")
            );
        }

        throw new IllegalArgumentException("Unsupported OAuth provider: " + provider);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : null;
    }

    private record OAuth2UserProfile(
        String providerUserId,
        String email,
        String name
    ) {
    }
}
