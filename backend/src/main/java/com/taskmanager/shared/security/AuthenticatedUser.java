package com.taskmanager.shared.security;

import java.util.UUID;

/**
 * Principal armazenado no contexto de segurança de uma requisição autenticada.
 * Os papéis são por projeto, então são resolvidos pelos serviços, não aqui.
 */
public record AuthenticatedUser(UUID id, String email) {
}
