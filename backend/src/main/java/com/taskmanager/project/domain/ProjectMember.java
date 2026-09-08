package com.taskmanager.project.domain;

import java.util.UUID;

/**
 * A project member enriched with the user's display fields, for the members list.
 */
public record ProjectMember(UUID userId, String name, String email, Role role) {
}
