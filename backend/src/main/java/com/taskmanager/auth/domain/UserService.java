package com.taskmanager.auth.domain;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;

/**
 * Owns the {@link User} table. Other features depend on this for user lookups;
 * they never touch {@link UserRepository} directly.
 */
@Service
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User create(String name, String email, String rawPassword) {
        if (users.existsByEmailIgnoreCase(email)) {
            throw Errors.conflict("email-already-registered", "Email already registered",
                    "An account with email %s already exists.".formatted(email));
        }
        return users.save(new User(name.trim(), email.trim().toLowerCase(),
                passwordEncoder.encode(rawPassword)));
    }

    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return users.findById(id).orElseThrow(() -> Errors.notFound("User", id));
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> Errors.notFound("User", email));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<User> findByEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim());
    }

    public boolean matchesPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }
}
