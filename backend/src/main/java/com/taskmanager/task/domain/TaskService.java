package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.project.domain.ProjectAuthorization;
import com.taskmanager.project.domain.ProjectMembership;
import com.taskmanager.shared.error.Errors;
import com.taskmanager.shared.event.TaskChangedEvent;

@Service
public class TaskService {

    private final TaskRepository tasks;
    private final ProjectAuthorization authorization;
    private final WipLimitPolicy wipLimit;
    private final TaskChangeLog historico;
    private final ApplicationEventPublisher events;

    public TaskService(TaskRepository tasks, ProjectAuthorization authorization, WipLimitPolicy wipLimit,
            TaskChangeLog historico, ApplicationEventPublisher events) {
        this.tasks = tasks;
        this.authorization = authorization;
        this.wipLimit = wipLimit;
        this.historico = historico;
        this.events = events;
    }

    @Transactional
    public Task criar(UUID projectId, UUID actorId, String title, String description,
            TaskPriority priority, UUID assigneeId, Instant deadline) {
        authorization.exigirMembro(projectId, actorId);
        exigirResponsavelMembro(projectId, assigneeId);
        Task tarefa = tasks.save(new Task(projectId, title.trim(), vazioParaNulo(description),
                priority, assigneeId, deadline, actorId));
        events.publishEvent(new TaskChangedEvent(projectId));
        return tarefa;
    }

    @Transactional(readOnly = true)
    public Task obterParaMembro(UUID taskId, UUID actorId) {
        Task tarefa = carregar(taskId);
        authorization.exigirMembro(tarefa.getProjectId(), actorId);
        return tarefa;
    }

    @Transactional(readOnly = true)
    public HistoricoDaTarefa historicoDaTarefa(UUID taskId, UUID actorId) {
        Task tarefa = carregar(taskId);
        authorization.exigirMembro(tarefa.getProjectId(), actorId);
        return new HistoricoDaTarefa(tarefa, historico.historico(taskId));
    }

    @Transactional(readOnly = true)
    public Page<Task> listar(UUID projectId, UUID actorId, TaskFilter filter, Pageable pageable) {
        authorization.exigirMembro(projectId, actorId);
        return tasks.findAll(TaskSpecifications.porProjeto(projectId, filter), TaskSort.sanear(pageable));
    }

    @Transactional(readOnly = true)
    public Page<Task> buscar(UUID projectId, UUID actorId, String term, Pageable pageable) {
        authorization.exigirMembro(projectId, actorId);
        String padrao = "%" + term.trim() + "%";
        return tasks.buscar(projectId, padrao, pageable);
    }

    @Transactional
    public Task editar(UUID taskId, UUID actorId, String title, String description,
            TaskPriority priority, UUID assigneeId, Instant deadline) {
        Task tarefa = carregar(taskId);
        authorization.exigirMembro(tarefa.getProjectId(), actorId);

        if (!tarefa.getAssigneeId().equals(assigneeId)) {
            exigirResponsavelMembro(tarefa.getProjectId(), assigneeId);
            if (tarefa.getStatus() == TaskStatus.IN_PROGRESS) {
                wipLimit.garantirQuePodeAssumirOutra(assigneeId, tarefa.getId());
            }
        }
        String tituloNovo = title.trim();
        String descricaoNova = vazioParaNulo(description);
        historico.registrarEdicao(tarefa, tituloNovo, descricaoNova, priority, assigneeId, deadline, actorId);
        tarefa.editar(tituloNovo, descricaoNova, priority, assigneeId, deadline);
        events.publishEvent(new TaskChangedEvent(tarefa.getProjectId()));
        return tarefa;
    }

    @Transactional
    public Task alterarStatus(UUID taskId, UUID actorId, TaskStatus alvo) {
        Task tarefa = carregar(taskId);
        ProjectMembership vinculo = authorization.exigirMembro(tarefa.getProjectId(), actorId);

        if (tarefa.getStatus() == alvo) {
            return tarefa; // RN-04: no-op idempotente
        }
        if (!tarefa.getStatus().podeTransicionarPara(alvo)) {
            throw Errors.naoProcessavel("invalid-status-transition", "Transição de status inválida",
                    "Uma tarefa não pode ir de %s para %s.".formatted(tarefa.getStatus(), alvo));
        }
        if (tarefa.getPriority() == TaskPriority.CRITICAL && alvo == TaskStatus.DONE && !vinculo.ehAdmin()) {
            throw Errors.acessoNegado("Apenas um ADMIN do projeto pode fechar uma tarefa CRITICAL.");
        }
        if (alvo == TaskStatus.IN_PROGRESS) {
            wipLimit.garantirQuePodeAssumirOutra(tarefa.getAssigneeId(), tarefa.getId());
        }
        historico.registrarMudancaDeStatus(tarefa.getId(), actorId, tarefa.getStatus(), alvo);
        tarefa.alterarStatus(alvo);
        events.publishEvent(new TaskChangedEvent(tarefa.getProjectId()));
        return tarefa;
    }

    @Transactional
    public void delete(UUID taskId, UUID actorId) {
        Task tarefa = carregar(taskId);
        ProjectMembership vinculo = authorization.exigirMembro(tarefa.getProjectId(), actorId);
        if (!vinculo.ehAdmin() && !tarefa.ehResponsavelPor(actorId)) {
            throw Errors.acessoNegado("Apenas um ADMIN do projeto ou o responsável pela tarefa pode excluí-la.");
        }
        tasks.delete(tarefa);
        events.publishEvent(new TaskChangedEvent(tarefa.getProjectId()));
    }

    private Task carregar(UUID taskId) {
        return tasks.findById(taskId).orElseThrow(() -> Errors.naoEncontrado("Tarefa", taskId));
    }

    private void exigirResponsavelMembro(UUID projectId, UUID assigneeId) {
        if (!authorization.ehMembro(projectId, assigneeId)) {
            throw Errors.naoProcessavel("assignee-not-member", "Responsável não é membro do projeto",
                    "O responsável precisa ser membro do projeto.");
        }
    }

    private static String vazioParaNulo(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // --- usado pelo adapter de realocação na remoção de membro ---

    public List<Task> tarefasAtivasDe(UUID projectId, UUID assigneeId) {
        return tasks.findByProjectIdAndAssigneeIdAndStatusIn(projectId, assigneeId,
                List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS));
    }

    /** Realoca uma tarefa durante a remoção de um membro: valida pertencimento (RN-62) e o WIP limit (RN-10). */
    public void realocarNaRemocao(UUID projectId, UUID actorId, Task tarefa, UUID newAssigneeId) {
        exigirResponsavelMembro(projectId, newAssigneeId);
        if (tarefa.getStatus() == TaskStatus.IN_PROGRESS) {
            wipLimit.garantirQuePodeAssumirOutra(newAssigneeId, tarefa.getId());
        }
        historico.registrarMudancaDeResponsavel(tarefa.getId(), actorId, tarefa.getAssigneeId(), newAssigneeId);
        tarefa.realocar(newAssigneeId);
        events.publishEvent(new TaskChangedEvent(projectId));
    }

    /** Tarefa + suas alterações, para montar a resposta do histórico. */
    public record HistoricoDaTarefa(Task tarefa, List<TaskChange> mudancas) {
    }
}
