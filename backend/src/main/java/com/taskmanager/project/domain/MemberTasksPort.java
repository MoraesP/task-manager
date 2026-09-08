package com.taskmanager.project.domain;

import java.util.List;
import java.util.UUID;

/**
 * Outbound port the project feature uses to hand off task bookkeeping when a
 * member is removed (RN-60..65). Implemented by the task feature so the project
 * feature never depends on task internals.
 */
public interface MemberTasksPort {

    /**
     * Reassign every active task the member owns in the project. Must throw
     * (rolling back the enclosing transaction) if a reassignment is missing, the
     * new assignee is not a project member, or the WIP limit would be exceeded.
     */
    void reassignForMemberRemoval(UUID projectId, UUID memberUserId, List<Reassignment> reassignments);

    record Reassignment(UUID taskId, UUID newAssigneeId) {
    }
}
