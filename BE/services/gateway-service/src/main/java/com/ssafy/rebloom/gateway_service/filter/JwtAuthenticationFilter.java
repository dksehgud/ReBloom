package com.ssafy.rebloom.gateway_service.filter;

import com.ssafy.rebloom.gateway_service.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    public static class Config {
        // application.yml 필터 파라미터 사용 시
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            try {
                Claims claims = jwtUtil.parseClaims(token);

                String userId = claims.getSubject();
                String role = claims.get("role", String.class);

                if (userId == null || role == null) {
                    log.warn("비정상적인 JWT 토큰 접근 감지 (필수 클레임 누락) - userId: {}, role: {}", userId, role);
                    return onError(exchange, HttpStatus.UNAUTHORIZED);
                }

                ServerHttpRequest modifiedRequest = request.mutate()
                    .headers(headers -> {
                        headers.remove("X-User-Id");
                        headers.remove("X-User-Role");
                    })
                    .header("X-User-Id", userId)
                    .header("X-User-Role", role)
                    .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (Exception e) {
                log.warn("JWT 검증 실패: {}", e.getMessage());
                return onError(exchange, HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }
}