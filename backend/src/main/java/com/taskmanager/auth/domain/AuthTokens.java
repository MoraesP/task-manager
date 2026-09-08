package com.taskmanager.auth.domain;

public record AuthTokens(String accessToken, String refreshToken, long expiresInSeconds) {
}
