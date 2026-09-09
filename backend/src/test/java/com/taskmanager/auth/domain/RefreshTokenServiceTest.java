package com.taskmanager.auth.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.config.AppProperties.Security;
import com.taskmanager.shared.config.AppProperties.Security.Cors;
import com.taskmanager.shared.config.AppProperties.Security.Jwt;
import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    RefreshTokenRepository tokens;

    RefreshTokenService service;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new Security(new Jwt("secret", Duration.ofMinutes(15), Duration.ofDays(7)),
                        new Cors("http://localhost:4200")),
                new AppProperties.Invitations(Duration.ofDays(7)),
                new AppProperties.Tasks(5),
                new AppProperties.Report(Duration.ofSeconds(60)));
        service = new RefreshTokenService(tokens, props);
    }

    @Test
    void issue_persistsHashedTokenAndReturnsRawValue() {
        String raw = service.emitir(UUID.randomUUID());

        ArgumentCaptor<RefreshToken> saved = ArgumentCaptor.forClass(RefreshToken.class);
        verify(tokens).save(saved.capture());
        assertThat(raw).isNotBlank();
        assertThat(saved.getValue().getTokenHash()).isNotEqualTo(raw);
    }

    @Test
    void consume_rotatesActiveToken() {
        UUID userId = UUID.randomUUID();
        RefreshToken active = new RefreshToken(userId, "hash", Instant.now().plusSeconds(3600));
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(active));

        RefreshToken consumed = service.consumir("raw");

        assertThat(consumed.getRevokedAt()).isNotNull();
        verify(tokens, never()).revogarTodosDoUsuario(any());
    }

    @Test
    void consume_revokedTokenRevokesWholeFamily() {
        UUID userId = UUID.randomUUID();
        RefreshToken revoked = new RefreshToken(userId, "hash", Instant.now().plusSeconds(3600));
        revoked.revogar(Instant.now().minusSeconds(10));
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.consumir("raw")).isInstanceOf(ApiException.class);
        verify(tokens).revogarTodosDoUsuario(userId);
    }

    @Test
    void consume_unknownTokenIsUnauthorized() {
        when(tokens.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consumir("raw")).isInstanceOf(ApiException.class);
    }
}
