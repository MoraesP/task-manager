package com.taskmanager.project.domain;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.auth.domain.User;
import com.taskmanager.auth.domain.UserDirectory;
import com.taskmanager.shared.error.Errors;

@Service
public class MembershipService {

    private final ProjectMembershipRepository memberships;
    private final ProjectAuthorization authorization;
    private final UserDirectory userDirectory;
    private final MemberTasksPort memberTasks;

    public MembershipService(ProjectMembershipRepository memberships, ProjectAuthorization authorization,
            UserDirectory userDirectory, MemberTasksPort memberTasks) {
        this.memberships = memberships;
        this.authorization = authorization;
        this.userDirectory = userDirectory;
        this.memberTasks = memberTasks;
    }

    @Transactional(readOnly = true)
    public List<ProjectMember> listMembers(UUID projectId, UUID actorId) {
        authorization.requireMembership(projectId, actorId);
        List<ProjectMembership> rows = memberships.findByProjectId(projectId);
        Map<UUID, User> usersById = userDirectory.findAllById(rows.stream().map(ProjectMembership::getUserId).toList());
        return rows.stream()
                .map(m -> {
                    User user = usersById.get(m.getUserId());
                    return new ProjectMember(m.getUserId(),
                            user == null ? "(unknown)" : user.getName(),
                            user == null ? "(unknown)" : user.getEmail(),
                            m.getRole());
                })
                .sorted(Comparator.comparing(ProjectMember::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public ProjectMember changeRole(UUID projectId, UUID actorId, UUID targetUserId, Role newRole) {
        authorization.requireAdmin(projectId, actorId);
        Project project = authorization.requireProject(projectId);
        ProjectMembership target = memberships.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> Errors.notFound("Project member", targetUserId));
        if (project.isOwnedBy(targetUserId)) {
            throw Errors.unprocessable("owner-role-immutable", "Owner role is immutable",
                    "The project owner is always ADMIN and cannot be changed.");
        }
        target.changeRole(newRole);
        User user = userDirectory.findAllById(List.of(targetUserId)).get(targetUserId);
        return new ProjectMember(targetUserId,
                user == null ? "(unknown)" : user.getName(),
                user == null ? "(unknown)" : user.getEmail(),
                target.getRole());
    }

    @Transactional
    public void removeMember(UUID projectId, UUID actorId, UUID targetUserId,
            List<MemberTasksPort.Reassignment> reassignments) {
        authorization.requireAdmin(projectId, actorId);
        Project project = authorization.requireProject(projectId);
        ProjectMembership target = memberships.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> Errors.notFound("Project member", targetUserId));
        if (project.isOwnedBy(targetUserId)) {
            throw Errors.forbidden("The project owner cannot be removed.");
        }
        memberTasks.reassignForMemberRemoval(projectId, targetUserId, reassignments);
        memberships.delete(target);
    }
}
