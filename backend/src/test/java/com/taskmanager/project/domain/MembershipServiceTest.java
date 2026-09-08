package com.taskmanager.project.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.auth.domain.UserDirectory;
import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class MembershipServiceTest {

    @Mock
    ProjectMembershipRepository memberships;
    @Mock
    ProjectAuthorization authorization;
    @Mock
    UserDirectory userDirectory;
    @Mock
    MemberTasksPort memberTasks;
    @InjectMocks
    MembershipService service;

    private final UUID projectId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final UUID targetId = UUID.randomUUID();

    @Test
    void changeRole_ownerRoleIsImmutable() {
        when(authorization.requireProject(projectId)).thenReturn(new Project("P", null, ownerId));
        when(memberships.findByProjectIdAndUserId(projectId, ownerId))
                .thenReturn(Optional.of(new ProjectMembership(projectId, ownerId, Role.ADMIN)));

        assertThatThrownBy(() -> service.changeRole(projectId, actorId, ownerId, Role.MEMBER))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    @Test
    void removeMember_ownerCannotBeRemoved() {
        when(authorization.requireProject(projectId)).thenReturn(new Project("P", null, ownerId));
        when(memberships.findByProjectIdAndUserId(projectId, ownerId))
                .thenReturn(Optional.of(new ProjectMembership(projectId, ownerId, Role.ADMIN)));

        assertThatThrownBy(() -> service.removeMember(projectId, actorId, ownerId, List.of()))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(memberTasks);
    }

    @Test
    void removeMember_reassignsTasksThenDeletesMembership() {
        Project project = new Project("P", null, ownerId);
        ProjectMembership target = new ProjectMembership(projectId, targetId, Role.MEMBER);
        when(authorization.requireProject(projectId)).thenReturn(project);
        when(memberships.findByProjectIdAndUserId(projectId, targetId)).thenReturn(Optional.of(target));

        service.removeMember(projectId, actorId, targetId, List.of());

        verify(memberTasks).reassignForMemberRemoval(eq(projectId), eq(targetId), any());
        verify(memberships).delete(target);
    }

    @Test
    void removeMember_requiresActorToBeAdmin() {
        when(authorization.requireAdmin(projectId, actorId))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "forbidden", "x", "y"));

        assertThatThrownBy(() -> service.removeMember(projectId, actorId, targetId, List.of()))
                .isInstanceOf(ApiException.class);
    }
}
