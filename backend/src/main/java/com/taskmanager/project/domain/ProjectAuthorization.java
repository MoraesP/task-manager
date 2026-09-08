package com.taskmanager.project.domain;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;

/**
 * Verificação de acesso central usada por toda feature que opera dentro de um
 * projeto. As checagens do "chamador" falham com 403; os <em>fatos</em> de
 * pertencimento são expostos como predicados para que cada chamador levante o
 * status certo no seu contexto.
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
        return projects.findById(projectId).orElseThrow(() -> Errors.notFound("Projeto", projectId));
    }

    @Transactional(readOnly = true)
    public ProjectMembership requireMembership(UUID projectId, UUID userId) {
        requireProject(projectId);
        return memberships.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> Errors.forbidden("Você não é membro deste projeto."));
    }

    @Transactional(readOnly = true)
    public ProjectMembership requireAdmin(UUID projectId, UUID userId) {
        ProjectMembership membership = requireMembership(projectId, userId);
        if (!membership.isAdmin()) {
            throw Errors.forbidden("Esta ação exige o papel ADMIN no projeto.");
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
