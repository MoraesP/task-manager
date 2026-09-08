package com.taskmanager.project.domain;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;

/**
 * Central access check used by every feature that works inside a project.
 * "Caller" checks fail with 403; membership <em>facts</em> are exposed as
 * predicates so callers can raise the right status for their context.
 */
@Service
public class ProjectAuthorization {

    private final ProjectRepository projects;
    private final ProjectMembershipRepository memberships;

    public ProjectAuthorization(ProjectRepository projects, ProjectMembershipRepository memberships) {
        this.projects = projects;
        this.memberships = memberships;
    }

    @Transactional(readOnly = true)
    public Project requireProject(UUID projectId) {
        return projects.findById(projectId).orElseThrow(() -> Errors.notFound("Project", projectId));
    }

    @Transactional(readOnly = true)
    public ProjectMembership requireMembership(UUID projectId, UUID userId) {
        requireProject(projectId);
        return memberships.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> Errors.forbidden("You are not a member of this project."));
    }

    @Transactional(readOnly = true)
    public ProjectMembership requireAdmin(UUID projectId, UUID userId) {
        ProjectMembership membership = requireMembership(projectId, userId);
        if (!membership.isAdmin()) {
            throw Errors.forbidden("This action requires the ADMIN role in the project.");
        }
        return membership;
    }

    @Transactional(readOnly = true)
    public boolean isMember(UUID projectId, UUID userId) {
        return memberships.existsByProjectIdAndUserId(projectId, userId);
    }

    @Transactional(readOnly = true)
    public Optional<ProjectMembership> membershipOf(UUID projectId, UUID userId) {
        return memberships.findByProjectIdAndUserId(projectId, userId);
    }
}
