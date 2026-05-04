package com.ssafy.rebloom.security.annotation;

import com.ssafy.rebloom.security.config.CommonSecurityConfig;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.context.annotation.Import;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(CommonSecurityConfig.class)
public @interface EnableRebloomSecurity {
    // 공통 시큐리티 필터 설정 @annotation
    // 서비스 모듈 Application 클래스에 추가
}