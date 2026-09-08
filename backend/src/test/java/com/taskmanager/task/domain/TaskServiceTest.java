package com.taskmanager.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.project.domain.ProjectAuthorization;
import com.taskmanager.project.domain.ProjectMembership;
import com.taskmanager.project.domain.Role;
import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    TaskRepository tasks;
    @Mock
    ProjectAuthorization authorization;
    @Mock
    WipLimitPolicy wipLimit;
    @InjectMocks
    TaskService service;

    private final UUID projectId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final UUID assigneeId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();

    // --- creation ---

    @Test
    void create_rejectsAssigneeThatIsNotAMember() {
        when(authorization.isMember(projectId, assigneeId)).thenReturn(false);

        assertThatThrownBy(() -> service.create(projectId, actorId, "t", null,
                TaskPriority.LOW, assigneeId, null))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    @Test
    void create_persistsTaskInTodo() {
        when(authorization.isMember(projectId, assigneeId)).thenReturn(true);
        when(tasks.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task task = service.create(projectId, actorId, " t ", " d ", TaskPriority.HIGH, assigneeId, null);

        assertThat(task.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(task.getTitle()).isEqualTo("t");
    }

    // --- state machine ---

    @Test
    void changeStatus_todoToDoneIsBlocked() {
        stubTask(task(TaskPriority.LOW, TaskStatus.TODO), Role.MEMBER);

        assertThatThrownBy(() -> service.changeStatus(taskId, actorId, TaskStatus.DONE))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    @Test
    void changeStatus_doneToTodoIsBlocked() {
        stubTask(task(TaskPriority.LOW, TaskStatus.DONE), Role.MEMBER);

        assertThatThrownBy(() -> service.changeStatus(taskId, actorId, TaskStatus.TODO))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void changeStatus_sameStatusIsIdempotentNoOp() {
        Task task = task(TaskPriority.LOW, TaskStatus.TODO);
        stubTask(task, Role.MEMBER);

        Task result = service.changeStatus(taskId, actorId, TaskStatus.TODO);

        assertThat(result.getStatus()).isEqualTo(TaskStatus.TODO);
        verify(wipLimit, never()).assertCanTakeAnother(any(), any());
    }

    @Test
    void changeStatus_toInProgressChecksWipLimit() {
        stubTask(task(TaskPriority.MEDIUM, TaskStatus.TODO), Role.MEMBER);

        service.changeStatus(taskId, actorId, TaskStatus.IN_PROGRESS);

        verify(wipLimit).assertCanTakeAnother(any(), any());
    }

    @Test
    void changeStatus_wipLimitViolationPropagates() {
        stubTask(task(TaskPriority.MEDIUM, TaskStatus.TODO), Role.MEMBER);
        doThrow(new ApiException(HttpStatus.CONFLICT, "wip-limit-exceeded", "x", "y"))
                .when(wipLimit).assertCanTakeAnother(any(), any());

        assertThatThrownBy(() -> service.changeStatus(taskId, actorId, TaskStatus.IN_PROGRESS))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    // --- CRITICAL rule ---

    @Test
    void changeStatus_memberCannotCloseCriticalTask() {
        stubTask(task(TaskPriority.CRITICAL, TaskStatus.IN_PROGRESS), Role.MEMBER);

        assertThatThrownBy(() -> service.changeStatus(taskId, actorId, TaskStatus.DONE))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void changeStatus_adminCanCloseCriticalTask() {
        stubTask(task(TaskPriority.CRITICAL, TaskStatus.IN_PROGRESS), Role.ADMIN);

        Task result = service.changeStatus(taskId, actorId, TaskStatus.DONE);

        assertThat(result.getStatus()).isEqualTo(TaskStatus.DONE);
    }

    @Test
    void changeStatus_memberCanReopenCriticalDoneTask() {
        stubTask(task(TaskPriority.CRITICAL, TaskStatus.DONE), Role.MEMBER);

        Task result = service.changeStatus(taskId, actorId, TaskStatus.IN_PROGRESS);

        assertThat(result.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    // --- edit / reassignment ---

    @Test
    void edit_reassignToNonMemberIsRejected() {
        Task task = task(TaskPriority.LOW, TaskStatus.TODO);
        when(tasks.findById(taskId)).thenReturn(Optional.of(task));
        when(authorization.requireMembership(any(), any()))
                .thenReturn(new ProjectMembership(projectId, actorId, Role.MEMBER));
        UUID other = UUID.randomUUID();
        when(authorization.isMember(task.getProjectId(), other)).thenReturn(false);

        assertThatThrownBy(() -> service.edit(taskId, actorId, "t", null, TaskPriority.LOW, other, null))
                .isInstanceOf(ApiException.class);
    }

    // --- delete ---

    @Test
    void delete_memberWhoIsNotAssigneeIsForbidden() {
        Task task = task(TaskPriority.LOW, TaskStatus.TODO); // assignee = assigneeId, not actorId
        when(tasks.findById(taskId)).thenReturn(Optional.of(task));
        when(authorization.requireMembership(any(), any()))
                .thenReturn(new ProjectMembership(projectId, actorId, Role.MEMBER));

        assertThatThrownBy(() -> service.delete(taskId, actorId))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void delete_assigneeCanDelete() {
        Task task = task(TaskPriority.LOW, TaskStatus.TODO);
        when(tasks.findById(taskId)).thenReturn(Optional.of(task));
        when(authorization.requireMembership(any(), any()))
                .thenReturn(new ProjectMembership(projectId, assigneeId, Role.MEMBER));

        assertThatCode(() -> service.delete(taskId, assigneeId)).doesNotThrowAnyException();
        verify(tasks).delete(task);
    }

    // --- helpers ---

    private Task task(TaskPriority priority, TaskStatus status) {
        Task task = new Task(projectId, "t", "d", priority, assigneeId, null);
        moveTo(task, status);
        return task;
    }

    private static void moveTo(Task task, TaskStatus target) {
        if (target == TaskStatus.IN_PROGRESS || target == TaskStatus.DONE) {
            task.changeStatus(TaskStatus.IN_PROGRESS);
        }
        if (target == TaskStatus.DONE) {
            task.changeStatus(TaskStatus.DONE);
        }
    }

    private void stubTask(Task task, Role actorRole) {
        when(tasks.findById(taskId)).thenReturn(Optional.of(task));
        when(authorization.requireMembership(task.getProjectId(), actorId))
                .thenReturn(new ProjectMembership(task.getProjectId(), actorId, actorRole));
    }
}
