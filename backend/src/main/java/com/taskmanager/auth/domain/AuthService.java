package com.taskmanager.auth.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;
import com.taskmanager.shared.security.JwtService;

@Service
public class AuthService {

    private final UserService users;
    private final RefreshTokenService refreshTokens;
    private final JwtService jwtService;

    public AuthService(UserService users, RefreshTokenService refreshTokens, JwtService jwtService) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.jwtService = jwtService;
    }

    @Transactional
    public User register(String name, String email, String rawPassword) {
        return users.create(name, email, rawPassword);
    }

    @Transactional
    public AuthTokens login(String email, String rawPassword) {
        User user = users.findByEmail(email)
                .filter(u -> users.matchesPassword(u, rawPassword))
                .orElseThrow(() -> Errors.unauthorized("Invalid email or password."));
        return issueFor(user);
    }

    @Transactional
    public AuthTokens refresh(String rawRefreshToken) {
        RefreshToken consumed = refreshTokens.consume(rawRefreshToken);
        User user = users.getById(consumed.getUserId());
        return issueFor(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokens.revoke(rawRefreshToken);
    }

    /** Used right after a user accepts an invitation so they land authenticated. */
    @Transactional
    public AuthTokens issueFor(User user) {
        String access = jwtService.issueAccessToken(user.getId(), user.getEmail());
        String refresh = refreshTokens.issue(user.getId());
        return new AuthTokens(access, refresh, jwtService.accessTokenTtlSeconds());
    }
}
