package com.taskmanager.shared.security;

import java.util.UUID;

/**
 * Principal stored in the security context for an authenticated request.
 * Roles are per-project, so they are resolved by services, not carried here.
 */
public record AuthenticatedUser(UUID id, String email) {
}
