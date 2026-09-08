package com.taskmanager.auth.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.Errors;

/**
 * Issues, rotates and revokes opaque refresh tokens. Reuse of an already-revoked
 * token revokes the whole family for that user (theft signal).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository tokens;
    private final AppProperties properties;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository tokens, AppProperties properties) {
        this.tokens = tokens;
        this.properties = properties;
    }

    /** @return the raw token to hand to the client (never persisted). */
    @Transactional
    public String issue(java.util.UUID userId) {
        String raw = generateRaw();
        Instant expiresAt = Instant.now().plus(properties.security().jwt().refreshTokenTtl());
        tokens.save(new RefreshToken(userId, hash(raw), expiresAt));
        return raw;
    }

    @Transactional
    public RefreshToken consume(String rawToken) {
        RefreshToken token = tokens.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> Errors.unauthorized("Invalid refresh token."));
        if (!token.isActive(Instant.now())) {
            tokens.revokeAllForUser(token.getUserId());
            throw Errors.unauthorized("Refresh token is expired or has been revoked.");
        }
        token.revoke(Instant.now());
        return token;
    }

    @Transactional
    public void revoke(String rawToken) {
        tokens.findByTokenHash(hash(rawToken))
                .ifPresent(token -> token.revoke(Instant.now()));
    }

    private String generateRaw() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
