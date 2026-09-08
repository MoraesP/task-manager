package com.taskmanager.project.api;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskmanager.project.api.ProjectDtos.CreateProjectRequest;
import com.taskmanager.project.api.ProjectDtos.ProjectResponse;
import com.taskmanager.project.api.ProjectDtos.UpdateProjectRequest;
import com.taskmanager.project.domain.ProjectService;
import com.taskmanager.shared.security.AuthenticatedUser;
import com.taskmanager.shared.web.PageResponse;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Projects")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateProjectRequest request) {
        return ProjectResponse.from(projectService.create(user.id(), request.name(), request.description()));
    }

    @GetMapping
    public PageResponse<ProjectResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(projectService.listForUser(user.id(), pageable), ProjectResponse::from);
    }

    @GetMapping("/{projectId}")
    public ProjectResponse get(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId) {
        return ProjectResponse.from(projectService.getForMember(projectId, user.id()));
    }

    @PutMapping("/{projectId}")
    public ProjectResponse update(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId, @Valid @RequestBody UpdateProjectRequest request) {
        return ProjectResponse.from(
                projectService.update(projectId, user.id(), request.name(), request.description()));
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID projectId) {
        projectService.delete(projectId, user.id());
    }
}
