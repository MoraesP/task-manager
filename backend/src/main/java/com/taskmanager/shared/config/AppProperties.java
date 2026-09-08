package com.taskmanager.shared.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração da aplicação com tipagem forte, vinculada à árvore {@code app.*}
 * do {@code application.yml}.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Security security,
        Invitations invitations,
        Tasks tasks,
        Report report) {

    public record Security(Jwt jwt, Cors cors) {
        public record Jwt(String secret, Duration accessTokenTtl, Duration refreshTokenTtl) {
        }

        public record Cors(String allowedOrigin) {
        }
    }

    public record Invitations(Duration ttl) {
    }

    public record Tasks(int wipLimit) {
    }

    public record Report(Duration cacheTtl) {
    }
}
