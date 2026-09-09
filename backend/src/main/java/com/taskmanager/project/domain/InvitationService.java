package com.taskmanager.project.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.auth.domain.User;
import com.taskmanager.auth.domain.UserService;
import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.Errors;
import com.taskmanager.shared.security.OpaqueTokens;

@Service
public class InvitationService {

    private final InvitationRepository invitations;
    private final ProjectMembershipRepository memberships;
    private final ProjectAuthorization authorization;
    private final UserService users;
    private final AppProperties properties;

    public InvitationService(InvitationRepository invitations, ProjectMembershipRepository memberships,
            ProjectAuthorization authorization, UserService users, AppProperties properties) {
        this.invitations = invitations;
        this.memberships = memberships;
        this.authorization = authorization;
        this.users = users;
        this.properties = properties;
    }

    /** @return o convite criado e o token bruto (exibido uma única vez). */
    @Transactional
    public ConviteCriado criar(UUID projectId, UUID actorId, String email, Role role) {
        authorization.exigirAdmin(projectId, actorId);
        String emailNormalizado = email.trim().toLowerCase();

        users.procurarPorEmail(emailNormalizado)
                .filter(usuario -> memberships.existsByProjectIdAndUserId(projectId, usuario.getId()))
                .ifPresent(usuario -> {
                    throw Errors.conflito("already-a-member", "Já é membro",
                            "%s já é membro deste projeto.".formatted(emailNormalizado));
                });

        if (invitations.existsByProjectIdAndEmailIgnoreCaseAndStatus(projectId, emailNormalizado,
                InvitationStatus.PENDING)) {
            throw Errors.conflito("pending-invitation-exists", "Já existe convite pendente",
                    "Já existe um convite pendente para %s neste projeto.".formatted(emailNormalizado));
        }

        String tokenBruto = OpaqueTokens.gerar();
        Instant expiresAt = Instant.now().plus(properties.invitations().ttl());
        Invitation convite = invitations.save(new Invitation(projectId, emailNormalizado, role,
                OpaqueTokens.gerarHash(tokenBruto), actorId, expiresAt));
        return new ConviteCriado(convite, tokenBruto);
    }

    @Transactional(readOnly = true)
    public List<Invitation> listarPendentes(UUID projectId, UUID actorId) {
        authorization.exigirAdmin(projectId, actorId);
        return invitations.findByProjectIdAndStatus(projectId, InvitationStatus.PENDING);
    }

    @Transactional
    public void revogar(UUID projectId, UUID actorId, UUID invitationId) {
        authorization.exigirAdmin(projectId, actorId);
        Invitation convite = invitations.findById(invitationId)
                .filter(i -> i.getProjectId().equals(projectId))
                .orElseThrow(() -> Errors.naoEncontrado("Convite", invitationId));
        if (!convite.estaPendente()) {
            throw Errors.naoProcessavel("invitation-not-pending", "Convite não está pendente",
                    "Somente um convite pendente pode ser revogado.");
        }
        convite.revogar();
    }

    @Transactional
    public ConviteAceito aceitar(String tokenBruto, String name, String senhaBruta) {
        Invitation convite = invitations.findByTokenHash(OpaqueTokens.gerarHash(tokenBruto))
                .orElseThrow(() -> Errors.naoProcessavel("invitation-invalid", "Convite inválido",
                        "Este token de convite não é válido."));

        if (!convite.estaPendente()) {
            throw Errors.naoProcessavel("invitation-not-pending", "Convite não está pendente",
                    "Este convite já foi usado ou foi revogado.");
        }
        if (convite.estaExpirado(Instant.now())) {
            convite.marcarExpirado();
            throw Errors.naoProcessavel("invitation-expired", "Convite expirado",
                    "Este convite expirou. Peça um novo a um ADMIN do projeto.");
        }

        User usuario = users.procurarPorEmail(convite.getEmail()).orElseGet(() -> {
            if (name == null || name.isBlank() || senhaBruta == null || senhaBruta.isBlank()) {
                throw Errors.naoProcessavel("account-details-required", "Dados da conta obrigatórios",
                        "Não existe conta para %s; nome e senha são obrigatórios para aceitar."
                                .formatted(convite.getEmail()));
            }
            return users.criar(name, convite.getEmail(), senhaBruta);
        });

        if (!memberships.existsByProjectIdAndUserId(convite.getProjectId(), usuario.getId())) {
            memberships.save(new ProjectMembership(convite.getProjectId(), usuario.getId(), convite.getRole()));
        }
        convite.aceitar();
        return new ConviteAceito(usuario.getId(), convite.getProjectId(), convite.getRole());
    }

    public record ConviteCriado(Invitation convite, String tokenBruto) {
    }

    public record ConviteAceito(UUID userId, UUID projectId, Role role) {
    }
}
