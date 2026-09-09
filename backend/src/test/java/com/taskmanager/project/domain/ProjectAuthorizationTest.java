package com.taskmanager.project.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class ProjectAuthorizationTest {

    @Mock
    ProjectRepository projects;
    @Mock
    ProjectMembershipRepository memberships;
    @InjectMocks
    ProjectAuthorization authorization;

    private final UUID projectId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @Test
    void requireProject_missingIsNotFound() {
        when(projects.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authorization.exigirProjeto(projectId))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void requireMembership_nonMemberIsForbidden() {
        when(projects.findById(projectId)).thenReturn(Optional.of(new Project("P", null, userId)));
        when(memberships.findByProjectIdAndUserId(projectId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authorization.exigirMembro(projectId, userId))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void requireAdmin_memberRoleIsForbidden() {
        when(projects.findById(projectId)).thenReturn(Optional.of(new Project("P", null, userId)));
        when(memberships.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(new ProjectMembership(projectId, userId, Role.MEMBER)));

        assertThatThrownBy(() -> authorization.exigirAdmin(projectId, userId))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void requireAdmin_adminRolePasses() {
        when(projects.findById(projectId)).thenReturn(Optional.of(new Project("P", null, userId)));
        when(memberships.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(new ProjectMembership(projectId, userId, Role.ADMIN)));

        assertThat(authorization.exigirAdmin(projectId, userId).getRole()).isEqualTo(Role.ADMIN);
    }
}
