package com.taskmanager.project.domain;

import java.time.Instant;
import java.util.UUID;

import com.taskmanager.shared.domain.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "invitations")
public class Invitation extends BaseEntity {

    @Column(name = "project_id", nullable = false, updatable = false)
    private UUID projectId;

    @Column(nullable = false, updatable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private Role role;

    @Column(name = "token_hash", nullable = false, unique = true, updatable = false)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status;

    @Column(name = "created_by_id", nullable = false, updatable = false)
    private UUID createdById;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    protected Invitation() {
    }

    public Invitation(UUID projectId, String email, Role role, String tokenHash, UUID createdById,
            Instant expiresAt) {
        this.projectId = projectId;
        this.email = email;
        this.role = role;
        this.tokenHash = tokenHash;
        this.createdById = createdById;
        this.expiresAt = expiresAt;
        this.status = InvitationStatus.PENDING;
    }

    public boolean isPending() {
        return status == InvitationStatus.PENDING;
    }

    public boolean isExpired(Instant now) {
        return expiresAt.isBefore(now);
    }

    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
    }

    public void revoke() {
        this.status = InvitationStatus.REVOKED;
    }

    public void markExpired() {
        this.status = InvitationStatus.EXPIRED;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public UUID getCreatedById() {
        return createdById;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
