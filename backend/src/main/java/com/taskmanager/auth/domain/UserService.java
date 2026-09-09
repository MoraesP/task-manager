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
    public User criar(String name, String email, String senhaBruta) {
        if (users.existsByEmailIgnoreCase(email)) {
            throw Errors.conflito("email-already-registered", "E-mail já cadastrado",
                    "Já existe uma conta com o e-mail %s.".formatted(email));
        }
        return users.save(new User(name.trim(), email.trim().toLowerCase(),
                passwordEncoder.encode(senhaBruta)));
    }

    @Transactional(readOnly = true)
    public User buscarPorId(UUID id) {
        return users.findById(id).orElseThrow(() -> Errors.naoEncontrado("Usuário", id));
    }

    @Transactional(readOnly = true)
    public User buscarPorEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> Errors.naoEncontrado("Usuário", email));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<User> procurarPorEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim());
    }

    public boolean senhaConfere(User usuario, String senhaBruta) {
        return passwordEncoder.matches(senhaBruta, usuario.getPasswordHash());
    }
}
