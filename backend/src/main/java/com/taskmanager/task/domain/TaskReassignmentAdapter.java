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
 * Task-side implementation of {@link MemberTasksPort}: reassigns every active
 * task of a member being removed (RN-61..64). Runs in the caller's transaction,
 * so any violation rolls the whole removal back.
 */
@Component
public class TaskReassignmentAdapter implements MemberTasksPort {

    private final TaskService taskService;

    public TaskReassignmentAdapter(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    @Transactional
    public void reassignForMemberRemoval(UUID projectId, UUID memberUserId, List<Reassignment> reassignments) {
        Map<UUID, UUID> newAssigneeByTask = reassignments.stream()
                .collect(Collectors.toMap(Reassignment::taskId, Reassignment::newAssigneeId,
                        (a, b) -> b));

        List<Task> activeTasks = taskService.activeTasksOf(projectId, memberUserId);
        for (Task task : activeTasks) {
            UUID newAssignee = newAssigneeByTask.get(task.getId());
            if (newAssignee == null) {
                throw Errors.unprocessable("reassignment-required", "Reassignment required",
                        "Task %s must be reassigned before the member can be removed.".formatted(task.getId()));
            }
            // isMember + WIP limit are validated inside TaskService.reassign / assignee check
            taskService.reassignForRemoval(projectId, task, newAssignee);
        }
    }
}
