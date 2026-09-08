package com.taskmanager.auth.api;

import com.taskmanager.auth.domain.AuthTokens;
import com.taskmanager.auth.domain.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payloads de requisição/resposta dos endpoints de autenticação.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(min = 8, max = 100) String password) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record LogoutRequest(@NotBlank String refreshToken) {
    }

    public record AcceptInvitationRequest(
            @NotBlank String token,
            @Size(max = 255) String name,
            @Size(min = 8, max = 100) String password) {
    }

    public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn) {
        public static TokenResponse from(AuthTokens tokens) {
            return new TokenResponse(tokens.accessToken(), tokens.refreshToken(), "Bearer",
                    tokens.expiresInSeconds());
        }
    }

    public record UserResponse(String id, String name, String email) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId().toString(), user.getName(), user.getEmail());
        }
    }
}
