package com.taskmanager.project.domain;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;

@Service
public class ProjectService {

    private final ProjectRepository projects;
    private final ProjectMembershipRepository memberships;
    private final ProjectAuthorization authorization;

    public ProjectService(ProjectRepository projects, ProjectMembershipRepository memberships,
            ProjectAuthorization authorization) {
        this.projects = projects;
        this.memberships = memberships;
        this.authorization = authorization;
    }

    @Transactional
    public ProjectDetail create(UUID ownerId, String name, String description) {
        Project project = projects.save(new Project(name.trim(), trimToNull(description), ownerId));
        memberships.save(new ProjectMembership(project.getId(), ownerId, Role.ADMIN));
        return new ProjectDetail(project, Role.ADMIN, 1);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDetail> listForUser(UUID userId, Pageable pageable) {
        // N+1 on membership count is acceptable: a user belongs to few projects.
        return projects.findAllForMember(userId, pageable).map(project -> toDetail(project, userId));
    }

    @Transactional(readOnly = true)
    public ProjectDetail getForMember(UUID projectId, UUID userId) {
        authorization.requireMembership(projectId, userId);
        return toDetail(authorization.requireProject(projectId), userId);
    }

    private ProjectDetail toDetail(Project project, UUID userId) {
        Role callerRole = authorization.membershipOf(project.getId(), userId)
                .map(ProjectMembership::getRole)
                .orElse(null);
        return new ProjectDetail(project, callerRole, memberships.countByProjectId(project.getId()));
    }

    @Transactional
    public ProjectDetail update(UUID projectId, UUID actorId, String name, String description) {
        authorization.requireAdmin(projectId, actorId);
        Project project = authorization.requireProject(projectId);
        project.update(name.trim(), trimToNull(description));
        return toDetail(project, actorId);
    }

    @Transactional
    public void delete(UUID projectId, UUID actorId) {
        Project project = authorization.requireProject(projectId);
        if (!project.isOwnedBy(actorId)) {
            throw Errors.forbidden("Only the project owner can delete the project.");
        }
        projects.delete(project); // DB cascades memberships, invitations, tasks
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
