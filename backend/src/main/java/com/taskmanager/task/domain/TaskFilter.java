package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Filtros opcionais e combináveis para a listagem de tarefas (RF-40). Um campo
 * nulo significa "sem restrição".
 */
public record TaskFilter(
        TaskStatus status,
        TaskPriority priority,
        UUID assigneeId,
        Instant createdFrom,
        Instant createdTo,
        Instant deadlineFrom,
        Instant deadlineTo) {

    public static TaskFilter empty() {
        return new TaskFilter(null, null, null, null, null, null, null);
    }
}
