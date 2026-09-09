package com.taskmanager.project.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.taskmanager.project.domain.Invitation;
import com.taskmanager.project.domain.ProjectDetail;
import com.taskmanager.project.domain.ProjectMember;
import com.taskmanager.project.domain.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    public record CreateProjectRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description) {
    }

    public record UpdateProjectRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description) {
    }

    public record ProjectResponse(
            UUID id, String name, String description, UUID ownerId,
            Role role, long memberCount, Instant createdAt, Instant updatedAt) {

        public static ProjectResponse from(ProjectDetail detail) {
            var p = detail.projeto();
            return new ProjectResponse(p.getId(), p.getName(), p.getDescription(), p.getOwnerId(),
                    detail.papelDoChamador(), detail.memberCount(), p.getCreatedAt(), p.getUpdatedAt());
        }
    }

    public record MemberResponse(UUID userId, String name, String email, Role role) {
        public static MemberResponse from(ProjectMember member) {
            return new MemberResponse(member.userId(), member.name(), member.email(), member.role());
        }
    }

    public record ChangeRoleRequest(@NotNull Role role) {
    }

    public record RemoveMemberRequest(List<Reassignment> reassignments) {
        public record Reassignment(@NotNull UUID taskId, @NotNull UUID newAssigneeId) {
        }
    }

    public record CreateInvitationRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotNull Role role) {
    }

    public record InvitationResponse(
            UUID id, String email, Role role, String status, Instant expiresAt) {
        public static InvitationResponse from(Invitation convite) {
            return new InvitationResponse(convite.getId(), convite.getEmail(), convite.getRole(),
                    convite.getStatus().name(), convite.getExpiresAt());
        }
    }

    public record CreatedInvitationResponse(
            UUID id, String email, Role role, String token, Instant expiresAt) {
    }
}
