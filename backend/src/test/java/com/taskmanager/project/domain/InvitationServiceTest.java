package com.taskmanager.project.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.auth.domain.User;
import com.taskmanager.auth.domain.UserService;
import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.ApiException;
import com.taskmanager.shared.security.OpaqueTokens;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock
    InvitationRepository invitations;
    @Mock
    ProjectMembershipRepository memberships;
    @Mock
    ProjectAuthorization authorization;
    @Mock
    UserService users;

    InvitationService service;

    private final UUID projectId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.Security(
                        new AppProperties.Security.Jwt("secret", Duration.ofMinutes(15), Duration.ofDays(7)),
                        new AppProperties.Security.Cors("http://localhost:4200")),
                new AppProperties.Invitations(Duration.ofDays(7)),
                new AppProperties.Tasks(5),
                new AppProperties.Report(Duration.ofSeconds(60)));
        service = new InvitationService(invitations, memberships, authorization, users, props);
    }

    @Test
    void create_rejectsWhenEmailAlreadyMember() {
        User existing = new User("Bob", "bob@example.com", "h");
        when(users.findByEmail("bob@example.com")).thenReturn(Optional.of(existing));
        when(memberships.existsByProjectIdAndUserId(any(), any())).thenReturn(true);

        assertThatThrownBy(() -> service.create(projectId, actorId, "bob@example.com", Role.MEMBER))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void create_rejectsDuplicatePendingInvitation() {
        when(users.findByEmail(any())).thenReturn(Optional.empty());
        when(invitations.existsByProjectIdAndEmailIgnoreCaseAndStatus(projectId, "new@example.com",
                InvitationStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> service.create(projectId, actorId, "new@example.com", Role.MEMBER))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void accept_unknownTokenIsUnprocessable() {
        when(invitations.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.accept("raw", null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    @Test
    void accept_expiredInvitationIsMarkedExpiredAndRejected() {
        Invitation invitation = invitation(Instant.now().minusSeconds(60));
        when(invitations.findByTokenHash(any())).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> service.accept("raw", null, null)).isInstanceOf(ApiException.class);
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.EXPIRED);
    }

    @Test
    void accept_absentUserWithoutCredentialsIsRejected() {
        Invitation invitation = invitation(Instant.now().plusSeconds(3600));
        when(invitations.findByTokenHash(any())).thenReturn(Optional.of(invitation));
        when(users.findByEmail(invitation.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.accept("raw", null, null)).isInstanceOf(ApiException.class);
        verify(users, never()).create(any(), any(), any());
    }

    @Test
    void accept_absentUserWithCredentialsCreatesAccountAndMembership() {
        Invitation invitation = invitation(Instant.now().plusSeconds(3600));
        User created = new User("Carol", "carol@example.com", "h");
        when(invitations.findByTokenHash(any())).thenReturn(Optional.of(invitation));
        when(users.findByEmail(invitation.getEmail())).thenReturn(Optional.empty());
        when(users.create("Carol", "carol@example.com", "password1")).thenReturn(created);
        when(memberships.existsByProjectIdAndUserId(any(), any())).thenReturn(false);

        InvitationService.AcceptedInvitation result = service.accept("raw", "Carol", "password1");

        assertThat(result.projectId()).isEqualTo(projectId);
        verify(memberships).save(any(ProjectMembership.class));
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.ACCEPTED);
    }

    @Test
    void accept_existingUserJustGainsMembership() {
        Invitation invitation = invitation(Instant.now().plusSeconds(3600));
        User existing = new User("Carol", "carol@example.com", "h");
        when(invitations.findByTokenHash(any())).thenReturn(Optional.of(invitation));
        when(users.findByEmail(invitation.getEmail())).thenReturn(Optional.of(existing));
        when(memberships.existsByProjectIdAndUserId(any(), any())).thenReturn(false);

        service.accept("raw", null, null);

        verify(users, never()).create(any(), any(), any());
        verify(memberships).save(any(ProjectMembership.class));
    }

    private Invitation invitation(Instant expiresAt) {
        return new Invitation(projectId, "carol@example.com", Role.MEMBER,
                OpaqueTokens.hash("raw"), actorId, expiresAt);
    }
}
