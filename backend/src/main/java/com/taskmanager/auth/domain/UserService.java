package com.taskmanager.auth.domain;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;

/**
 * Dono da tabela {@link User}. As outras features dependem deste serviço para
 * consultar usuários; nunca acessam o {@link UserRepository} diretamente.
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
            throw Errors.conflict("email-already-registered", "E-mail já cadastrado",
                    "Já existe uma conta com o e-mail %s.".formatted(email));
        }
        return users.save(new User(name.trim(), email.trim().toLowerCase(),
                passwordEncoder.encode(rawPassword)));
    }

    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return users.findById(id).orElseThrow(() -> Errors.notFound("Usuário", id));
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> Errors.notFound("Usuário", email));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<User> findByEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim());
    }

    public boolean matchesPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }
}
