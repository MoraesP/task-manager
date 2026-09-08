package com.taskmanager.task.api;

import java.time.Instant;
import java.util.UUID;

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
}
