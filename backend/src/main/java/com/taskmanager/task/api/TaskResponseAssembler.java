package com.taskmanager.task.api;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.taskmanager.auth.domain.User;
import com.taskmanager.auth.domain.UserDirectory;
import com.taskmanager.shared.web.PageResponse;
import com.taskmanager.task.api.TaskDtos.TaskResponse;
import com.taskmanager.task.domain.Task;

/**
 * Monta os {@link TaskResponse}, resolvendo o nome do responsável em uma única
 * consulta em lote para evitar N+1 nas respostas de listagem/busca.
 */
@Component
public class TaskResponseAssembler {

    private final UserDirectory userDirectory;

    public TaskResponseAssembler(UserDirectory userDirectory) {
        this.userDirectory = userDirectory;
    }

    public TaskResponse toResponse(Task task) {
        return build(task, resolveNames(List.of(task)));
    }

    public PageResponse<TaskResponse> toPage(Page<Task> page) {
        Map<UUID, String> names = resolveNames(page.getContent());
        return PageResponse.of(page.map(task -> build(task, names)));
    }

    private Map<UUID, String> resolveNames(Collection<Task> tasks) {
        List<UUID> assigneeIds = tasks.stream().map(Task::getAssigneeId).distinct().toList();
        return userDirectory.findAllById(assigneeIds).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getName()));
    }

    private TaskResponse build(Task task, Map<UUID, String> names) {
        return new TaskResponse(
                task.getId(), task.getProjectId(), task.getTitle(), task.getDescription(),
                task.getStatus(), task.getPriority(), task.getAssigneeId(),
                names.getOrDefault(task.getAssigneeId(), "(desconhecido)"),
                task.getDeadline(), task.isOverdue(Instant.now()),
                task.getCreatedAt(), task.getUpdatedAt());
    }
}
