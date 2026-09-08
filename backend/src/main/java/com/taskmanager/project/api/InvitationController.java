package com.taskmanager.project.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskmanager.project.api.ProjectDtos.CreateInvitationRequest;
import com.taskmanager.project.api.ProjectDtos.CreatedInvitationResponse;
import com.taskmanager.project.api.ProjectDtos.InvitationResponse;
import com.taskmanager.project.domain.InvitationService;
import com.taskmanager.project.domain.InvitationService.CreatedInvitation;
import com.taskmanager.shared.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/invitations")
@Tag(name = "Convites do projeto")
@SecurityRequirement(name = "bearerAuth")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatedInvitationResponse create(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId, @Valid @RequestBody CreateInvitationRequest request) {
        CreatedInvitation created = invitationService.create(projectId, user.id(), request.email(), request.role());
        var invitation = created.invitation();
        return new CreatedInvitationResponse(invitation.getId(), invitation.getEmail(), invitation.getRole(),
                created.rawToken(), invitation.getExpiresAt());
    }

    @GetMapping
    public List<InvitationResponse> listPending(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId) {
        return invitationService.listPending(projectId, user.id()).stream()
                .map(InvitationResponse::from)
                .toList();
    }

    @DeleteMapping("/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId, @PathVariable UUID invitationId) {
        invitationService.revoke(projectId, user.id(), invitationId);
    }
}
