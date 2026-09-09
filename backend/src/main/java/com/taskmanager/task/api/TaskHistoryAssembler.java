package com.taskmanager.task.api;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.taskmanager.auth.domain.User;
import com.taskmanager.auth.domain.UserDirectory;
import com.taskmanager.task.api.TaskDtos.TaskChangeResponse;
import com.taskmanager.task.api.TaskDtos.TaskHistoryResponse;
import com.taskmanager.task.api.TaskDtos.UserRef;
import com.taskmanager.task.domain.Task;
import com.taskmanager.task.domain.TaskChange;
import com.taskmanager.task.domain.TaskChangeType;
import com.taskmanager.task.domain.TaskService.HistoricoDaTarefa;

/**
 * Monta a resposta do histórico resolvendo, numa única consulta em lote, os
 * nomes de quem criou, de cada autor e dos responsáveis antigo/novo.
 */
@Component
public class TaskHistoryAssembler {

    private static final String DESCONHECIDO = "(desconhecido)";

    private final UserDirectory userDirectory;

    public TaskHistoryAssembler(UserDirectory userDirectory) {
        this.userDirectory = userDirectory;
    }

    public TaskHistoryResponse montar(HistoricoDaTarefa historico) {
        Task tarefa = historico.tarefa();
        List<TaskChange> mudancas = historico.mudancas();

        Set<UUID> ids = new LinkedHashSet<>();
        if (tarefa.getCreatedById() != null) {
            ids.add(tarefa.getCreatedById());
        }
        for (TaskChange mudanca : mudancas) {
            ids.add(mudanca.getAuthorId());
            if (mudanca.getType() == TaskChangeType.ALTERACAO_RESPONSAVEL) {
                adicionarUuid(ids, mudanca.getOldValue());
                adicionarUuid(ids, mudanca.getNewValue());
            }
        }
        Map<UUID, User> usuarios = userDirectory.buscarPorIds(new ArrayList<>(ids));

        List<TaskChangeResponse> changes = mudancas.stream()
                .map(mudanca -> paraResposta(mudanca, usuarios))
                .toList();

        UserRef criadoPor = tarefa.getCreatedById() == null
                ? null
                : refDe(tarefa.getCreatedById(), usuarios);
        return new TaskHistoryResponse(tarefa.getCreatedAt(), criadoPor, changes);
    }

    private TaskChangeResponse paraResposta(TaskChange mudanca, Map<UUID, User> usuarios) {
        String antigo = mudanca.getOldValue();
        String novo = mudanca.getNewValue();
        if (mudanca.getType() == TaskChangeType.ALTERACAO_RESPONSAVEL) {
            antigo = nomeDoUsuario(antigo, usuarios);
            novo = nomeDoUsuario(novo, usuarios);
        }
        return new TaskChangeResponse(mudanca.getOccurredAt(),
                refDe(mudanca.getAuthorId(), usuarios), mudanca.getType(), antigo, novo);
    }

    private UserRef refDe(UUID id, Map<UUID, User> usuarios) {
        User usuario = usuarios.get(id);
        return new UserRef(id, usuario == null ? DESCONHECIDO : usuario.getName());
    }

    private String nomeDoUsuario(String idComoTexto, Map<UUID, User> usuarios) {
        if (idComoTexto == null) {
            return null;
        }
        try {
            User usuario = usuarios.get(UUID.fromString(idComoTexto));
            return usuario == null ? DESCONHECIDO : usuario.getName();
        } catch (IllegalArgumentException naoEhUuid) {
            return idComoTexto;
        }
    }

    private static void adicionarUuid(Set<UUID> ids, String idComoTexto) {
        if (idComoTexto == null) {
            return;
        }
        try {
            ids.add(UUID.fromString(idComoTexto));
        } catch (IllegalArgumentException ignorado) {
            // valor não-UUID: nada a resolver
        }
    }
}
