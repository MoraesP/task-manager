package com.taskmanager.shared.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.taskmanager.shared.config.AppProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Issues and validates the short-lived access token (HS256). Refresh tokens are
 * opaque and handled by the auth feature, not here.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final AppProperties.Security.Jwt config;

    public JwtService(AppProperties properties) {
        this.config = properties.security().jwt();
        this.key = Keys.hmacShaKeyFor(config.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(config.accessTokenTtl())))
                .signWith(key)
                .compact();
    }

    public long accessTokenTtlSeconds() {
        return config.accessTokenTtl().toSeconds();
    }

    /**
     * @return the authenticated user, or {@code null} when the token is missing,
     *         malformed, expired or badly signed.
     */
    public AuthenticatedUser parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return new AuthenticatedUser(UUID.fromString(claims.getSubject()),
                    claims.get("email", String.class));
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }
}
