package com.taskmanager.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.project.domain.MemberTasksPort.Reassignment;
import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class TaskReassignmentAdapterTest {

    @Mock
    TaskService taskService;
    @InjectMocks
    TaskReassignmentAdapter adapter;

    private final UUID projectId = UUID.randomUUID();
    private final UUID member = UUID.randomUUID();

    @Test
    void rejectsWhenAnActiveTaskHasNoReassignment() {
        Task task = new Task(projectId, "t", null, TaskPriority.LOW, member, null);
        when(taskService.activeTasksOf(projectId, member)).thenReturn(List.of(task));

        assertThatThrownBy(() -> adapter.reassignForMemberRemoval(projectId, member, List.of()))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    @Test
    void reassignsEveryActiveTask() {
        Task task = new Task(projectId, "t", null, TaskPriority.LOW, member, null);
        UUID newAssignee = UUID.randomUUID();
        when(taskService.activeTasksOf(projectId, member)).thenReturn(List.of(task));

        assertThatCode(() -> adapter.reassignForMemberRemoval(projectId, member,
                List.of(new Reassignment(task.getId(), newAssignee)))).doesNotThrowAnyException();

        verify(taskService).reassignForRemoval(eq(projectId), any(Task.class), eq(newAssignee));
    }
}
