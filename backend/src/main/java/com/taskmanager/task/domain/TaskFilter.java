package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Optional, combinable filters for the task list (RF-40). A null field means
 * "no constraint".
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
