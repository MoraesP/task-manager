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
    private final ApplicationEventPublisher events;

    public TaskService(TaskRepository tasks, ProjectAuthorization authorization, WipLimitPolicy wipLimit,
            ApplicationEventPublisher events) {
        this.tasks = tasks;
        this.authorization = authorization;
        this.wipLimit = wipLimit;
        this.events = events;
    }

    @Transactional
    public Task create(UUID projectId, UUID actorId, String title, String description,
            TaskPriority priority, UUID assigneeId, Instant deadline) {
        authorization.requireMembership(projectId, actorId);
        requireAssigneeIsMember(projectId, assigneeId);
        Task task = tasks.save(new Task(projectId, title.trim(), trimToNull(description), priority, assigneeId, deadline));
        events.publishEvent(new TaskChangedEvent(projectId));
        return task;
    }

    @Transactional(readOnly = true)
    public Task getForMember(UUID taskId, UUID actorId) {
        Task task = load(taskId);
        authorization.requireMembership(task.getProjectId(), actorId);
        return task;
    }

    @Transactional(readOnly = true)
    public Page<Task> list(UUID projectId, UUID actorId, TaskFilter filter, Pageable pageable) {
        authorization.requireMembership(projectId, actorId);
        return tasks.findAll(TaskSpecifications.forProject(projectId, filter), TaskSort.sanitize(pageable));
    }

    @Transactional(readOnly = true)
    public Page<Task> search(UUID projectId, UUID actorId, String term, Pageable pageable) {
        authorization.requireMembership(projectId, actorId);
        String pattern = "%" + term.trim() + "%";
        return tasks.search(projectId, pattern, pageable);
    }

    @Transactional
    public Task edit(UUID taskId, UUID actorId, String title, String description,
            TaskPriority priority, UUID assigneeId, Instant deadline) {
        Task task = load(taskId);
        authorization.requireMembership(task.getProjectId(), actorId);

        if (!task.getAssigneeId().equals(assigneeId)) {
            requireAssigneeIsMember(task.getProjectId(), assigneeId);
            if (task.getStatus() == TaskStatus.IN_PROGRESS) {
                wipLimit.assertCanTakeAnother(assigneeId, task.getId());
            }
        }
        task.edit(title.trim(), trimToNull(description), priority, assigneeId, deadline);
        events.publishEvent(new TaskChangedEvent(task.getProjectId()));
        return task;
    }

    @Transactional
    public Task changeStatus(UUID taskId, UUID actorId, TaskStatus target) {
        Task task = load(taskId);
        ProjectMembership membership = authorization.requireMembership(task.getProjectId(), actorId);

        if (task.getStatus() == target) {
            return task; // RN-04: no-op idempotente
        }
        if (!task.getStatus().canTransitionTo(target)) {
            throw Errors.unprocessable("invalid-status-transition", "Transição de status inválida",
                    "Uma tarefa não pode ir de %s para %s.".formatted(task.getStatus(), target));
        }
        if (task.getPriority() == TaskPriority.CRITICAL && target == TaskStatus.DONE && !membership.isAdmin()) {
            throw Errors.forbidden("Apenas um ADMIN do projeto pode fechar uma tarefa CRITICAL.");
        }
        if (target == TaskStatus.IN_PROGRESS) {
            wipLimit.assertCanTakeAnother(task.getAssigneeId(), task.getId());
        }
        task.changeStatus(target);
        events.publishEvent(new TaskChangedEvent(task.getProjectId()));
        return task;
    }

    @Transactional
    public void delete(UUID taskId, UUID actorId) {
        Task task = load(taskId);
        ProjectMembership membership = authorization.requireMembership(task.getProjectId(), actorId);
        if (!membership.isAdmin() && !task.isAssignedTo(actorId)) {
            throw Errors.forbidden("Apenas um ADMIN do projeto ou o responsável pela tarefa pode excluí-la.");
        }
        tasks.delete(task);
        events.publishEvent(new TaskChangedEvent(task.getProjectId()));
    }

    private Task load(UUID taskId) {
        return tasks.findById(taskId).orElseThrow(() -> Errors.notFound("Tarefa", taskId));
    }

    private void requireAssigneeIsMember(UUID projectId, UUID assigneeId) {
        if (!authorization.isMember(projectId, assigneeId)) {
            throw Errors.unprocessable("assignee-not-member", "Responsável não é membro do projeto",
                    "O responsável precisa ser membro do projeto.");
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // --- usado pelo adapter de realocação na remoção de membro ---

    public List<Task> activeTasksOf(UUID projectId, UUID assigneeId) {
        return tasks.findByProjectIdAndAssigneeIdAndStatusIn(projectId, assigneeId,
                List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS));
    }

    /** Realoca uma tarefa durante a remoção de um membro: valida pertencimento (RN-62) e o WIP limit (RN-10). */
    public void reassignForRemoval(UUID projectId, Task task, UUID newAssigneeId) {
        requireAssigneeIsMember(projectId, newAssigneeId);
        if (task.getStatus() == TaskStatus.IN_PROGRESS) {
            wipLimit.assertCanTakeAnother(newAssigneeId, task.getId());
        }
        task.reassign(newAssigneeId);
        events.publishEvent(new TaskChangedEvent(projectId));
    }
}
