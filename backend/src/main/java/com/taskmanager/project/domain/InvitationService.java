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
    public CreatedInvitation create(UUID projectId, UUID actorId, String email, Role role) {
        authorization.requireAdmin(projectId, actorId);
        String normalizedEmail = email.trim().toLowerCase();

        users.findByEmail(normalizedEmail)
                .filter(user -> memberships.existsByProjectIdAndUserId(projectId, user.getId()))
                .ifPresent(user -> {
                    throw Errors.conflict("already-a-member", "Já é membro",
                            "%s já é membro deste projeto.".formatted(normalizedEmail));
                });

        if (invitations.existsByProjectIdAndEmailIgnoreCaseAndStatus(projectId, normalizedEmail,
                InvitationStatus.PENDING)) {
            throw Errors.conflict("pending-invitation-exists", "Já existe convite pendente",
                    "Já existe um convite pendente para %s neste projeto.".formatted(normalizedEmail));
        }

        String rawToken = OpaqueTokens.generate();
        Instant expiresAt = Instant.now().plus(properties.invitations().ttl());
        Invitation invitation = invitations.save(new Invitation(projectId, normalizedEmail, role,
                OpaqueTokens.hash(rawToken), actorId, expiresAt));
        return new CreatedInvitation(invitation, rawToken);
    }

    @Transactional(readOnly = true)
    public List<Invitation> listPending(UUID projectId, UUID actorId) {
        authorization.requireAdmin(projectId, actorId);
        return invitations.findByProjectIdAndStatus(projectId, InvitationStatus.PENDING);
    }

    @Transactional
    public void revoke(UUID projectId, UUID actorId, UUID invitationId) {
        authorization.requireAdmin(projectId, actorId);
        Invitation invitation = invitations.findById(invitationId)
                .filter(i -> i.getProjectId().equals(projectId))
                .orElseThrow(() -> Errors.notFound("Convite", invitationId));
        if (!invitation.isPending()) {
            throw Errors.unprocessable("invitation-not-pending", "Convite não está pendente",
                    "Somente um convite pendente pode ser revogado.");
        }
        invitation.revoke();
    }

    @Transactional
    public AcceptedInvitation accept(String rawToken, String name, String rawPassword) {
        Invitation invitation = invitations.findByTokenHash(OpaqueTokens.hash(rawToken))
                .orElseThrow(() -> Errors.unprocessable("invitation-invalid", "Convite inválido",
                        "Este token de convite não é válido."));

        if (!invitation.isPending()) {
            throw Errors.unprocessable("invitation-not-pending", "Convite não está pendente",
                    "Este convite já foi usado ou foi revogado.");
        }
        if (invitation.isExpired(Instant.now())) {
            invitation.markExpired();
            throw Errors.unprocessable("invitation-expired", "Convite expirado",
                    "Este convite expirou. Peça um novo a um ADMIN do projeto.");
        }

        User user = users.findByEmail(invitation.getEmail()).orElseGet(() -> {
            if (name == null || name.isBlank() || rawPassword == null || rawPassword.isBlank()) {
                throw Errors.unprocessable("account-details-required", "Dados da conta obrigatórios",
                        "Não existe conta para %s; nome e senha são obrigatórios para aceitar."
                                .formatted(invitation.getEmail()));
            }
            return users.create(name, invitation.getEmail(), rawPassword);
        });

        if (!memberships.existsByProjectIdAndUserId(invitation.getProjectId(), user.getId())) {
            memberships.save(new ProjectMembership(invitation.getProjectId(), user.getId(), invitation.getRole()));
        }
        invitation.accept();
        return new AcceptedInvitation(user.getId(), invitation.getProjectId(), invitation.getRole());
    }

    public record CreatedInvitation(Invitation invitation, String rawToken) {
    }

    public record AcceptedInvitation(UUID userId, UUID projectId, Role role) {
    }
}
