package com.taskmanager.task.domain;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.project.domain.MemberTasksPort;
import com.taskmanager.shared.error.Errors;

/**
 * Implementação, no lado da tarefa, de {@link MemberTasksPort}: realoca toda
 * tarefa ativa de um membro que está sendo removido (RN-61..64). Roda na
 * transação do chamador, então qualquer violação reverte a remoção inteira.
 */
@Component
public class TaskReassignmentAdapter implements MemberTasksPort {

    private final TaskService taskService;

    public TaskReassignmentAdapter(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    @Transactional
    public void realocarNaRemocaoDeMembro(UUID projectId, UUID memberUserId, List<Reassignment> reassignments) {
        Map<UUID, UUID> novoResponsavelPorTarefa = reassignments.stream()
                .collect(Collectors.toMap(Reassignment::taskId, Reassignment::newAssigneeId,
                        (a, b) -> b));

        List<Task> tarefasAtivas = taskService.tarefasAtivasDe(projectId, memberUserId);
        for (Task tarefa : tarefasAtivas) {
            UUID novoResponsavel = novoResponsavelPorTarefa.get(tarefa.getId());
            if (novoResponsavel == null) {
                throw Errors.naoProcessavel("reassignment-required", "Realocação obrigatória",
                        "A tarefa %s precisa ser realocada antes de o membro poder ser removido."
                                .formatted(tarefa.getId()));
            }
            // pertencimento + WIP limit são validados dentro de TaskService.realocarNaRemocao
            taskService.realocarNaRemocao(projectId, tarefa, novoResponsavel);
        }
    }
}
