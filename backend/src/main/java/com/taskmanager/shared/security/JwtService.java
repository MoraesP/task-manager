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
 * Emite e valida o access token de curta duração (HS256). Os refresh tokens são
 * opacos e tratados pela feature de autenticação, não aqui.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final AppProperties.Security.Jwt config;

    public JwtService(AppProperties properties) {
        this.config = properties.security().jwt();
        this.key = Keys.hmacShaKeyFor(config.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String emitirAccessToken(UUID userId, String email) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(config.accessTokenTtl())))
                .signWith(key)
                .compact();
    }

    public long ttlDoAccessTokenEmSegundos() {
        return config.accessTokenTtl().toSeconds();
    }

    /**
     * @return o usuário autenticado, ou {@code null} quando o token está ausente,
     *         malformado, expirado ou com assinatura inválida.
     */
    public AuthenticatedUser analisar(String token) {
        try {
            Claims reivindicacoes = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return new AuthenticatedUser(UUID.fromString(reivindicacoes.getSubject()),
                    reivindicacoes.get("email", String.class));
        } catch (JwtException | IllegalArgumentException excecao) {
            return null;
        }
    }
}
