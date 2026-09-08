package com.taskmanager.auth.domain;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.Errors;
import com.taskmanager.shared.security.OpaqueTokens;

/**
 * Issues, rotates and revokes opaque refresh tokens. Reuse of an already-revoked
 * token revokes the whole family for that user (theft signal).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository tokens;
    private final AppProperties properties;

    public RefreshTokenService(RefreshTokenRepository tokens, AppProperties properties) {
        this.tokens = tokens;
        this.properties = properties;
    }

    /** @return the raw token to hand to the client (never persisted). */
    @Transactional
    public String issue(java.util.UUID userId) {
        String raw = OpaqueTokens.generate();
        Instant expiresAt = Instant.now().plus(properties.security().jwt().refreshTokenTtl());
        tokens.save(new RefreshToken(userId, OpaqueTokens.hash(raw), expiresAt));
        return raw;
    }

    @Transactional
    public RefreshToken consume(String rawToken) {
        RefreshToken token = tokens.findByTokenHash(OpaqueTokens.hash(rawToken))
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
        tokens.findByTokenHash(OpaqueTokens.hash(rawToken))
                .ifPresent(token -> token.revoke(Instant.now()));
    }
}
