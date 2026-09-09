package com.taskmanager.project.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    ProjectRepository projects;
    @Mock
    ProjectMembershipRepository memberships;
    @Mock
    ProjectAuthorization authorization;
    @InjectMocks
    ProjectService service;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    @Test
    void create_addsOwnerAsAdminMember() {
        when(projects.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectDetail detail = service.criar(ownerId, "Alpha", "desc");

        assertThat(detail.papelDoChamador()).isEqualTo(Role.ADMIN);
        verify(memberships).save(any(ProjectMembership.class));
    }

    @Test
    void delete_nonOwnerIsForbidden() {
        when(authorization.exigirProjeto(projectId))
                .thenReturn(new Project("Alpha", null, ownerId));

        assertThatThrownBy(() -> service.delete(projectId, UUID.randomUUID()))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void delete_ownerDeletesProject() {
        Project project = new Project("Alpha", null, ownerId);
        when(authorization.exigirProjeto(projectId)).thenReturn(project);

        service.delete(projectId, ownerId);

        verify(projects).delete(project);
    }
}
