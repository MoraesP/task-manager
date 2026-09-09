package com.taskmanager.project.domain;

import java.util.UUID;

import com.taskmanager.shared.domain.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "project_memberships",
        uniqueConstraints = @UniqueConstraint(name = "uq_membership_project_user",
                columnNames = {"project_id", "user_id"}))
public class ProjectMembership extends BaseEntity {

    @Column(name = "project_id", nullable = false, updatable = false)
    private UUID projectId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    protected ProjectMembership() {
    }

    public ProjectMembership(UUID projectId, UUID userId, Role role) {
        this.projectId = projectId;
        this.userId = userId;
        this.role = role;
    }

    public void alterarPapel(Role role) {
        this.role = role;
    }

    public boolean ehAdmin() {
        return role == Role.ADMIN;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getUserId() {
        return userId;
    }

    public Role getRole() {
        return role;
    }
}
