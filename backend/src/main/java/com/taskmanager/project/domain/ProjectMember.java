package com.taskmanager.project.domain;

import java.util.UUID;

/**
 * Um membro do projeto enriquecido com os campos de exibição do usuário, para a
 * lista de membros.
 */
public record ProjectMember(UUID userId, String name, String email, Role role) {
}
