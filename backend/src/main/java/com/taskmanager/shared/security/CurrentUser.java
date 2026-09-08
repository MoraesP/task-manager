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

    public static AuthenticatedUser get() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user;
        }
        throw Errors.unauthorized("Nenhum usuário autenticado no contexto.");
    }

    public static UUID id() {
        return get().id();
    }
}
