package com.taskmanager.shared.event;

import java.util.UUID;

/**
 * Published whenever a task in a project is created, updated, moved or deleted.
 * Consumed by the report feature to evict its cache (ADR 0006).
 */
public record TaskChangedEvent(UUID projectId) {
}
