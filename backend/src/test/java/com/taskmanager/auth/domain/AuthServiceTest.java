package com.taskmanager.auth.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.taskmanager.shared.error.ApiException;
import com.taskmanager.shared.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserService users;
    @Mock
    RefreshTokenService refreshTokens;
    @Mock
    JwtService jwtService;
    @InjectMocks
    AuthService authService;

    @Test
    void login_withWrongPasswordIsUnauthorized() {
        User user = new User("Ana", "ana@example.com", "hash");
        when(users.findByEmail("ana@example.com")).thenReturn(Optional.of(user));
        when(users.matchesPassword(user, "wrong")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("ana@example.com", "wrong"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void login_withUnknownEmailIsUnauthorized() {
        when(users.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("nobody@example.com", "x"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void login_successIssuesAccessAndRefreshTokens() {
        User user = new User("Ana", "ana@example.com", "hash");
        when(users.findByEmail("ana@example.com")).thenReturn(Optional.of(user));
        when(users.matchesPassword(user, "right")).thenReturn(true);
        when(jwtService.issueAccessToken(any(), eq("ana@example.com"))).thenReturn("access");
        when(jwtService.accessTokenTtlSeconds()).thenReturn(900L);
        when(refreshTokens.issue(any())).thenReturn("refresh");

        AuthTokens tokens = authService.login("ana@example.com", "right");

        assertThat(tokens.accessToken()).isEqualTo("access");
        assertThat(tokens.refreshToken()).isEqualTo("refresh");
        assertThat(tokens.expiresInSeconds()).isEqualTo(900L);
    }

    @Test
    void refresh_rotatesTokenForResolvedUser() {
        UUID userId = UUID.randomUUID();
        RefreshToken consumed = new RefreshToken(userId, "hash", java.time.Instant.now().plusSeconds(60));
        User user = new User("Ana", "ana@example.com", "hash");
        when(refreshTokens.consume("old")).thenReturn(consumed);
        when(users.getById(userId)).thenReturn(user);
        when(jwtService.issueAccessToken(any(), any())).thenReturn("access2");
        when(refreshTokens.issue(any())).thenReturn("refresh2");

        AuthTokens tokens = authService.refresh("old");

        assertThat(tokens.refreshToken()).isEqualTo("refresh2");
    }
}
