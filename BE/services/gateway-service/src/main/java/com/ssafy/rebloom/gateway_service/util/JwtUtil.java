package com.ssafy.rebloom.gateway_service.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;

@Component
public class JwtUtil {

    private final Key secretKey;

    // ⭐️ 핵심: Auth 서버의 application.yml에 있는 jwt.secret 값과
    // 게이트웨이의 application.yml에 있는 jwt.secret 값이 "완전히 동일"해야 합니다!
    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 토큰을 해독하여 안에 들어있는 데이터(Claims)를 꺼냅니다.
     *
     * @param token 클라이언트가 보낸 Access Token
     * @return 파싱된 토큰 데이터 (userId, role 등)
     * @throws io.jsonwebtoken.ExpiredJwtException         토큰이 만료되었을 때
     * @throws io.jsonwebtoken.security.SignatureException 서명이 틀렸을 때 (위조)
     * @throws io.jsonwebtoken.MalformedJwtException       토큰 형태가 이상할 때
     */
    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(secretKey) // 똑같은 비밀키로 열어봄
            .build()
            .parseClaimsJws(token)    // 여기서 검증! 실패하면 Exception 터짐
            .getBody();               // 통과하면 데이터 꺼냄
    }
}