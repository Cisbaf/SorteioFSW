package com.sorteiofsw.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtService {
    private final SecretKey key;
    @Getter
    private final long expirationSeconds;

    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration:3600}") long expirationSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = expirationSeconds;
    }

    public String generate(String username) {
        var now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(key)
                .compact();
    }

    public String username(String token){
        return claims(token).getSubject();
    }

    public boolean valid(String token){
        try {
            return claims(token).getExpiration().after(new Date());
        }catch (RuntimeException e){
            return false;
        }
    }

    private Claims claims(String token){
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
