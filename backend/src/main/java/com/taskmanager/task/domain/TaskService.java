package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.project.domain.ProjectAuthorization;
import com.taskmanager.project.domain.ProjectMembership;
import com.taskmanager.shared.error.Errors;

@Service
public class TaskService {

    private final TaskRepository tasks;
    private final ProjectAuthorization authorization;
    private final WipLimitPolicy wipLimit;

    public TaskService(TaskRepository tasks, ProjectAuthorization authorization, WipLimitPolicy wipLimit) {
        this.tasks = tasks;
        this.authorization = authorization;
        this.wipLimit = wipLimit;
    }

    @Transactional
    public Task create(UUID projectId, UUID actorId, String title, String description,
            TaskPriority priority, UUID assigneeId, Instant deadline) {
        authorization.requireMembership(projectId, actorId);
        requireAssigneeIsMember(projectId, assigneeId);
        return tasks.save(new Task(projectId, title.trim(), trimToNull(description), priority, assigneeId, deadline));
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
        return task;
    }

    @Transactional
    public Task changeStatus(UUID taskId, UUID actorId, TaskStatus target) {
        Task task = load(taskId);
        ProjectMembership membership = authorization.requireMembership(task.getProjectId(), actorId);

        if (task.getStatus() == target) {
            return task; // RN-04 idempotent no-op
        }
        if (!task.getStatus().canTransitionTo(target)) {
            throw Errors.unprocessable("invalid-status-transition", "Invalid status transition",
                    "A task cannot move from %s to %s.".formatted(task.getStatus(), target));
        }
        if (task.getPriority() == TaskPriority.CRITICAL && target == TaskStatus.DONE && !membership.isAdmin()) {
            throw Errors.forbidden("Only a project ADMIN can close a CRITICAL task.");
        }
        if (target == TaskStatus.IN_PROGRESS) {
            wipLimit.assertCanTakeAnother(task.getAssigneeId(), task.getId());
        }
        task.changeStatus(target);
        return task;
    }

    @Transactional
    public void delete(UUID taskId, UUID actorId) {
        Task task = load(taskId);
        ProjectMembership membership = authorization.requireMembership(task.getProjectId(), actorId);
        if (!membership.isAdmin() && !task.isAssignedTo(actorId)) {
            throw Errors.forbidden("Only a project ADMIN or the task assignee can delete this task.");
        }
        tasks.delete(task);
    }

    private Task load(UUID taskId) {
        return tasks.findById(taskId).orElseThrow(() -> Errors.notFound("Task", taskId));
    }

    private void requireAssigneeIsMember(UUID projectId, UUID assigneeId) {
        if (!authorization.isMember(projectId, assigneeId)) {
            throw Errors.unprocessable("assignee-not-member", "Assignee is not a project member",
                    "The assignee must be a member of the project.");
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // --- used by the member-removal reassignment adapter ---

    public List<Task> activeTasksOf(UUID projectId, UUID assigneeId) {
        return tasks.findByProjectIdAndAssigneeIdAndStatusIn(projectId, assigneeId,
                List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS));
    }

    /** Reassign one task during a member removal: validates membership (RN-62) and WIP (RN-10). */
    public void reassignForRemoval(UUID projectId, Task task, UUID newAssigneeId) {
        requireAssigneeIsMember(projectId, newAssigneeId);
        if (task.getStatus() == TaskStatus.IN_PROGRESS) {
            wipLimit.assertCanTakeAnother(newAssigneeId, task.getId());
        }
        task.reassign(newAssigneeId);
    }
}
