package com.taskmanager.shared.security;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;

import com.taskmanager.shared.error.Errors;

/**
 * Convenience accessor for the authenticated principal. Controllers usually take
 * {@code @AuthenticationPrincipal AuthenticatedUser}; services that are far from
 * the web layer use this.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthenticatedUser get() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user;
        }
        throw Errors.unauthorized("No authenticated user in context.");
    }

    public static UUID id() {
        return get().id();
    }
}
