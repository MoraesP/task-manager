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
    public Project exigirProjeto(UUID projectId) {
        return projects.findById(projectId).orElseThrow(() -> Errors.naoEncontrado("Projeto", projectId));
    }

    @Transactional(readOnly = true)
    public ProjectMembership exigirMembro(UUID projectId, UUID userId) {
        exigirProjeto(projectId);
        return memberships.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> Errors.acessoNegado("Você não é membro deste projeto."));
    }

    @Transactional(readOnly = true)
    public ProjectMembership exigirAdmin(UUID projectId, UUID userId) {
        ProjectMembership vinculo = exigirMembro(projectId, userId);
        if (!vinculo.ehAdmin()) {
            throw Errors.acessoNegado("Esta ação exige o papel ADMIN no projeto.");
        }
        return vinculo;
    }

    @Transactional(readOnly = true)
    public boolean ehMembro(UUID projectId, UUID userId) {
        return memberships.existsByProjectIdAndUserId(projectId, userId);
    }

    @Transactional(readOnly = true)
    public Optional<ProjectMembership> membroDe(UUID projectId, UUID userId) {
        return memberships.findByProjectIdAndUserId(projectId, userId);
    }
}
