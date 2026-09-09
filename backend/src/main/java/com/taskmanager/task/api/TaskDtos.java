package com.taskmanager.task.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.taskmanager.task.domain.TaskChangeType;
import com.taskmanager.task.domain.TaskPriority;
import com.taskmanager.task.domain.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class TaskDtos {

    private TaskDtos() {
    }

    public record CreateTaskRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 20_000) String description,
            @NotNull TaskPriority priority,
            Instant deadline,
            @NotNull UUID assigneeId) {
    }

    public record UpdateTaskRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 20_000) String description,
            @NotNull TaskPriority priority,
            Instant deadline,
            @NotNull UUID assigneeId) {
    }

    public record ChangeStatusRequest(@NotNull TaskStatus status) {
    }

    public record TaskResponse(
            UUID id,
            UUID projectId,
            String title,
            String description,
            TaskStatus status,
            TaskPriority priority,
            UUID assigneeId,
            String assigneeName,
            Instant deadline,
            boolean overdue,
            Instant createdAt,
            Instant updatedAt) {
    }

    /** Referência enxuta a um usuário (id + nome) para o histórico. */
    public record UserRef(UUID id, String name) {
    }

    /** Uma alteração no histórico da tarefa. `oldValue`/`newValue` são o valor
     *  "de wire" (nome do enum, ISO da data, texto); para `ALTERACAO_RESPONSAVEL`
     *  já vêm resolvidos como nome do usuário. */
    public record TaskChangeResponse(
            Instant occurredAt,
            UserRef author,
            TaskChangeType type,
            String oldValue,
            String newValue) {
    }

    /** Histórico completo de uma tarefa: criação + alterações em ordem cronológica. */
    public record TaskHistoryResponse(
            Instant createdAt,
            UserRef createdBy,
            List<TaskChangeResponse> changes) {
    }
}
