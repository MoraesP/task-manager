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
    public List<ProjectMember> listarMembros(UUID projectId, UUID actorId) {
        authorization.exigirMembro(projectId, actorId);
        List<ProjectMembership> linhas = memberships.findByProjectId(projectId);
        Map<UUID, User> usersById = userDirectory.buscarPorIds(linhas.stream().map(ProjectMembership::getUserId).toList());
        return linhas.stream()
                .map(m -> {
                    User usuario = usersById.get(m.getUserId());
                    return new ProjectMember(m.getUserId(),
                            usuario == null ? "(desconhecido)" : usuario.getName(),
                            usuario == null ? "(desconhecido)" : usuario.getEmail(),
                            m.getRole());
                })
                .sorted(Comparator.comparing(ProjectMember::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public ProjectMember alterarPapel(UUID projectId, UUID actorId, UUID usuarioAlvoId, Role novoPapel) {
        authorization.exigirAdmin(projectId, actorId);
        Project projeto = authorization.exigirProjeto(projectId);
        ProjectMembership alvo = memberships.findByProjectIdAndUserId(projectId, usuarioAlvoId)
                .orElseThrow(() -> Errors.naoEncontrado("Membro do projeto", usuarioAlvoId));
        if (projeto.pertenceA(usuarioAlvoId)) {
            throw Errors.naoProcessavel("owner-role-immutable", "Papel do dono é imutável",
                    "O dono do projeto é sempre ADMIN e não pode ser alterado.");
        }
        alvo.alterarPapel(novoPapel);
        User usuario = userDirectory.buscarPorIds(List.of(usuarioAlvoId)).get(usuarioAlvoId);
        return new ProjectMember(usuarioAlvoId,
                usuario == null ? "(desconhecido)" : usuario.getName(),
                usuario == null ? "(desconhecido)" : usuario.getEmail(),
                alvo.getRole());
    }

    @Transactional
    public void removerMembro(UUID projectId, UUID actorId, UUID usuarioAlvoId,
            List<MemberTasksPort.Reassignment> reassignments) {
        authorization.exigirAdmin(projectId, actorId);
        Project projeto = authorization.exigirProjeto(projectId);
        ProjectMembership alvo = memberships.findByProjectIdAndUserId(projectId, usuarioAlvoId)
                .orElseThrow(() -> Errors.naoEncontrado("Membro do projeto", usuarioAlvoId));
        if (projeto.pertenceA(usuarioAlvoId)) {
            throw Errors.acessoNegado("O dono do projeto não pode ser removido.");
        }
        memberTasks.realocarNaRemocaoDeMembro(projectId, actorId, usuarioAlvoId, reassignments);
        memberships.delete(alvo);
    }
}
