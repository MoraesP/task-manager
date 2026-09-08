package com.taskmanager.task.domain;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.Errors;

/**
 * Enforces RN-10..12: at most N tasks IN_PROGRESS per assignee, counted across
 * every project.
 */
@Component
public class WipLimitPolicy {

    private final TaskRepository tasks;
    private final int limit;

    public WipLimitPolicy(TaskRepository tasks, AppProperties properties) {
        this.tasks = tasks;
        this.limit = properties.tasks().wipLimit();
    }

    /**
     * @param excludingTaskId the task about to move/land in IN_PROGRESS, so it is
     *                        not double-counted; may be {@code null}.
     */
    public void assertCanTakeAnother(UUID assigneeId, UUID excludingTaskId) {
        List<UUID> inProgress = tasks.findIdsByAssigneeAndStatus(assigneeId, TaskStatus.IN_PROGRESS).stream()
                .filter(id -> !id.equals(excludingTaskId))
                .toList();
        if (inProgress.size() >= limit) {
            throw Errors.conflict("wip-limit-exceeded", "WIP limit exceeded",
                    "The assignee already has %d tasks IN_PROGRESS (limit: %d)."
                            .formatted(inProgress.size(), limit),
                    Map.of("limit", limit, "tasksInProgress", inProgress));
        }
    }
}
