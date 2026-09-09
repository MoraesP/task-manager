package com.taskmanager.shared.security;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;

import com.taskmanager.shared.error.Errors;

/**
 * Acesso conveniente ao principal autenticado. Controllers normalmente recebem
 * {@code @AuthenticationPrincipal AuthenticatedUser}; serviços distantes da
 * camada web usam esta classe.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthenticatedUser obter() {
        var autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao != null && autenticacao.getPrincipal() instanceof AuthenticatedUser usuario) {
            return usuario;
        }
        throw Errors.naoAutenticado("Nenhum usuário autenticado no contexto.");
    }

    public static UUID id() {
        return obter().id();
    }
}
