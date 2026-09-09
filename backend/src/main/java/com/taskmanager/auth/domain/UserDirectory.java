package com.taskmanager.auth.domain;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Visão somente leitura de usuários para features que precisam exibir nome/e-mail
 * (ex.: lista de membros do projeto, rótulo do responsável pela tarefa).
 */
@Service
public class UserDirectory {

    private final UserRepository users;

    public UserDirectory(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Map<UUID, User> buscarPorIds(Collection<UUID> ids) {
        return users.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }
}
