package com.taskmanager.project.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskmanager.project.api.ProjectDtos.ChangeRoleRequest;
import com.taskmanager.project.api.ProjectDtos.MemberResponse;
import com.taskmanager.project.api.ProjectDtos.RemoveMemberRequest;
import com.taskmanager.project.domain.MemberTasksPort;
import com.taskmanager.project.domain.MembershipService;
import com.taskmanager.shared.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@Tag(name = "Project members")
@SecurityRequirement(name = "bearerAuth")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping
    public List<MemberResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId) {
        return membershipService.listMembers(projectId, user.id()).stream()
                .map(MemberResponse::from)
                .toList();
    }

    @PatchMapping("/{userId}")
    public MemberResponse changeRole(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId, @PathVariable UUID userId,
            @Valid @RequestBody ChangeRoleRequest request) {
        return MemberResponse.from(membershipService.changeRole(projectId, user.id(), userId, request.role()));
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId, @PathVariable UUID userId,
            @RequestBody(required = false) RemoveMemberRequest request) {
        List<MemberTasksPort.Reassignment> reassignments = request == null || request.reassignments() == null
                ? List.of()
                : request.reassignments().stream()
                        .map(r -> new MemberTasksPort.Reassignment(r.taskId(), r.newAssigneeId()))
                        .toList();
        membershipService.removeMember(projectId, user.id(), userId, reassignments);
    }
}
