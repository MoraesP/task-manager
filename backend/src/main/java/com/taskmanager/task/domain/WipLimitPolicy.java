package com.taskmanager.task.domain;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.Errors;

/**
 * Aplica RN-10..12: no máximo N tarefas IN_PROGRESS por responsável, contando
 * todos os projetos.
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
     * @param excludingTaskId a tarefa prestes a entrar em IN_PROGRESS, para não
     *                        ser contada duas vezes; pode ser {@code null}.
     */
    public void assertCanTakeAnother(UUID assigneeId, UUID excludingTaskId) {
        List<UUID> inProgress = tasks.findIdsByAssigneeAndStatus(assigneeId, TaskStatus.IN_PROGRESS).stream()
                .filter(id -> !id.equals(excludingTaskId))
                .toList();
        if (inProgress.size() >= limit) {
            throw Errors.conflict("wip-limit-exceeded", "WIP limit excedido",
                    "O responsável já tem %d tarefas IN_PROGRESS (limite: %d)."
                            .formatted(inProgress.size(), limit),
                    Map.of("limit", limit, "tasksInProgress", inProgress));
        }
    }
}
