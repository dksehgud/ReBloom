package com.ssafy.rebloom.gateway_service.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
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
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}