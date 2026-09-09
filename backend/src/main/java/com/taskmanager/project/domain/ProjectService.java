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
    public ProjectDetail criar(UUID ownerId, String name, String description) {
        Project projeto = projects.save(new Project(name.trim(), vazioParaNulo(description), ownerId));
        memberships.save(new ProjectMembership(projeto.getId(), ownerId, Role.ADMIN));
        return new ProjectDetail(projeto, Role.ADMIN, 1);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDetail> listarDoUsuario(UUID userId, Pageable pageable) {
        // N+1 na contagem de membros é aceitável: um usuário pertence a poucos projetos.
        return projects.buscarTodosDoMembro(userId, pageable).map(projeto -> paraDetalhe(projeto, userId));
    }

    @Transactional(readOnly = true)
    public ProjectDetail obterParaMembro(UUID projectId, UUID userId) {
        authorization.exigirMembro(projectId, userId);
        return paraDetalhe(authorization.exigirProjeto(projectId), userId);
    }

    private ProjectDetail paraDetalhe(Project projeto, UUID userId) {
        Role papelDoChamador = authorization.membroDe(projeto.getId(), userId)
                .map(ProjectMembership::getRole)
                .orElse(null);
        return new ProjectDetail(projeto, papelDoChamador, memberships.countByProjectId(projeto.getId()));
    }

    @Transactional
    public ProjectDetail atualizar(UUID projectId, UUID actorId, String name, String description) {
        authorization.exigirAdmin(projectId, actorId);
        Project projeto = authorization.exigirProjeto(projectId);
        projeto.atualizar(name.trim(), vazioParaNulo(description));
        return paraDetalhe(projeto, actorId);
    }

    @Transactional
    public void delete(UUID projectId, UUID actorId) {
        Project projeto = authorization.exigirProjeto(projectId);
        if (!projeto.pertenceA(actorId)) {
            throw Errors.acessoNegado("Apenas o dono do projeto pode excluí-lo.");
        }
        projects.delete(projeto); // o banco faz cascade em memberships, convites e tarefas
    }

    private static String vazioParaNulo(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
