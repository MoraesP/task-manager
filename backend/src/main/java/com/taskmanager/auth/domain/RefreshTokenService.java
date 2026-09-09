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
    public String emitir(java.util.UUID userId) {
        String bruto = OpaqueTokens.gerar();
        Instant expiraEm = Instant.now().plus(properties.security().jwt().refreshTokenTtl());
        tokens.save(new RefreshToken(userId, OpaqueTokens.gerarHash(bruto), expiraEm));
        return bruto;
    }

    @Transactional
    public RefreshToken consumir(String tokenBruto) {
        RefreshToken token = tokens.findByTokenHash(OpaqueTokens.gerarHash(tokenBruto))
                .orElseThrow(() -> Errors.naoAutenticado("Refresh token inválido."));
        if (!token.estaAtivo(Instant.now())) {
            tokens.revogarTodosDoUsuario(token.getUserId());
            throw Errors.naoAutenticado("O refresh token está expirado ou foi revogado.");
        }
        token.revogar(Instant.now());
        return token;
    }

    @Transactional
    public void revogar(String tokenBruto) {
        tokens.findByTokenHash(OpaqueTokens.gerarHash(tokenBruto))
                .ifPresent(token -> token.revogar(Instant.now()));
    }
}
