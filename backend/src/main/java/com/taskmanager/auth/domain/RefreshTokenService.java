package com.taskmanager.auth.domain;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.Errors;
import com.taskmanager.shared.security.OpaqueTokens;

/**
 * Emite, rotaciona e revoga refresh tokens opacos. O reuso de um token já
 * revogado revoga toda a cadeia daquele usuário (indício de roubo).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository tokens;
    private final AppProperties properties;

    public RefreshTokenService(RefreshTokenRepository tokens, AppProperties properties) {
        this.tokens = tokens;
        this.properties = properties;
    }

    /** @return o token bruto para entregar ao cliente (nunca persistido). */
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
                .orElseThrow(() -> Errors.unauthorized("Refresh token inválido."));
        if (!token.isActive(Instant.now())) {
            tokens.revokeAllForUser(token.getUserId());
            throw Errors.unauthorized("O refresh token está expirado ou foi revogado.");
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
