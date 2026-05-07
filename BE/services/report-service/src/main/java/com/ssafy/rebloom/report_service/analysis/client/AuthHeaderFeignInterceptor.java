package com.ssafy.rebloom.report_service.analysis.client;

import com.ssafy.rebloom.security.dto.AuthUserInfo;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthHeaderFeignInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserInfo authUserInfo)) {
            return;
        }

        template.header("x-user-id", authUserInfo.id().toString());
        template.header("x-user-role", authUserInfo.role());
    }
}
