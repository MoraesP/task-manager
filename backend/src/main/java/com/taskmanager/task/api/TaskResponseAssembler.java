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

    public TaskResponse paraResposta(Task tarefa) {
        return montar(tarefa, resolverNomes(List.of(tarefa)));
    }

    public PageResponse<TaskResponse> paraPagina(Page<Task> page) {
        Map<UUID, String> names = resolverNomes(page.getContent());
        return PageResponse.de(page.map(tarefa -> montar(tarefa, names)));
    }

    private Map<UUID, String> resolverNomes(Collection<Task> tasks) {
        List<UUID> idsDosResponsaveis = tasks.stream().map(Task::getAssigneeId).distinct().toList();
        return userDirectory.buscarPorIds(idsDosResponsaveis).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getName()));
    }

    private TaskResponse montar(Task tarefa, Map<UUID, String> names) {
        return new TaskResponse(
                tarefa.getId(), tarefa.getProjectId(), tarefa.getTitle(), tarefa.getDescription(),
                tarefa.getStatus(), tarefa.getPriority(), tarefa.getAssigneeId(),
                names.getOrDefault(tarefa.getAssigneeId(), "(desconhecido)"),
                tarefa.getDeadline(), tarefa.estaAtrasada(Instant.now()),
                tarefa.getCreatedAt(), tarefa.getUpdatedAt());
    }
}
